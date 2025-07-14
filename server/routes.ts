import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertRoomSchema, insertGameSchema, insertMoveSchema } from "@shared/schema";
import { AIPlayer } from "./aiPlayer";
import { makeMove, checkWin, checkDraw, getOpponentSymbol, validateMove } from "./gameLogic";

interface WSConnection {
  ws: WebSocket;
  userId: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  const connections = new Map<string, WSConnection>();
  const roomConnections = new Map<string, Set<string>>();
  const matchmakingQueue: string[] = []; // Queue of user IDs waiting for matches

  // User stats route
  app.get('/api/users/:id/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Online matchmaking endpoint
  app.post('/api/matchmaking/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      // Check if user is already in queue
      if (matchmakingQueue.includes(userId)) {
        return res.json({ status: 'waiting', message: 'Already in matchmaking queue' });
      }
      
      // Add to queue
      matchmakingQueue.push(userId);
      
      // Check if we can make a match (need 2 players)
      if (matchmakingQueue.length >= 2) {
        // Remove two players from queue
        const player1Id = matchmakingQueue.shift()!;
        const player2Id = matchmakingQueue.shift()!;
        
        // Create room for matched players
        const room = await storage.createRoom({
          name: `Match ${Date.now()}`,
          isPrivate: false,
          maxPlayers: 2,
          ownerId: player1Id,
        });
        
        // Add both players as participants
        await storage.addRoomParticipant({
          roomId: room.id,
          userId: player1Id,
          role: 'player',
        });
        
        await storage.addRoomParticipant({
          roomId: room.id,
          userId: player2Id,
          role: 'player',
        });
        
        // Notify both players via WebSocket
        const notifyPlayer = (playerId: string) => {
          // Find connection by userId
          for (const [connId, connection] of connections.entries()) {
            if (connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'match_found',
                room: room,
                opponent: playerId === player1Id ? player2Id : player1Id,
              }));
              break;
            }
          }
        };
        
        notifyPlayer(player1Id);
        notifyPlayer(player2Id);
        
        res.json({ status: 'matched', room: room });
      } else {
        res.json({ status: 'waiting', message: 'Waiting for another player...' });
      }
    } catch (error) {
      console.error("Error in matchmaking:", error);
      res.status(500).json({ message: "Failed to join matchmaking" });
    }
  });
  
  // Leave matchmaking queue
  app.post('/api/matchmaking/leave', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const index = matchmakingQueue.indexOf(userId);
      if (index > -1) {
        matchmakingQueue.splice(index, 1);
      }
      res.json({ message: 'Left matchmaking queue' });
    } catch (error) {
      console.error("Error leaving matchmaking:", error);
      res.status(500).json({ message: "Failed to leave matchmaking" });
    }
  });

  // Room routes
  app.post('/api/rooms', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const roomData = insertRoomSchema.parse(req.body);
      
      const room = await storage.createRoom({
        ...roomData,
        ownerId: userId,
      });

      // Add owner as participant
      await storage.addRoomParticipant({
        roomId: room.id,
        userId,
        role: 'player',
      });

      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.post('/api/rooms/:code/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { code } = req.params;
      const { role = 'player' } = req.body;

      const room = await storage.getRoomByCode(code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const participants = await storage.getRoomParticipants(room.id);
      
      // Check if user is already in the room
      const existingParticipant = participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return res.json({ message: "Already in room", room });
      }

      // Check if room is full (only for players)
      const playerCount = participants.filter(p => p.role === 'player').length;
      if (role === 'player' && playerCount >= 2) {
        return res.status(400).json({ message: "Room is full" });
      }

      await storage.addRoomParticipant({
        roomId: room.id,
        userId,
        role,
      });

      res.json({ message: "Joined room successfully", room });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.get('/api/rooms/:id/participants', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getRoomParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Game routes
  app.post('/api/games', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      console.log('Game creation request:', req.body);
      console.log('User ID:', userId);
      
      // Validate the request body with detailed error reporting
      const parseResult = insertGameSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log('Schema validation failed:', parseResult.error);
        return res.status(400).json({ 
          message: "Invalid game data", 
          errors: parseResult.error.errors 
        });
      }
      
      const gameData = parseResult.data;
      console.log('Parsed game data:', gameData);
      
      let gameCreateData;
      
      if (gameData.gameMode === 'ai') {
        // AI mode: current user vs AI
        gameCreateData = {
          ...gameData,
          playerXId: userId,
          playerOId: 'AI',
        };
      } else if (gameData.gameMode === 'online' && gameData.roomId) {
        // Online mode: get room participants and assign as players
        const participants = await storage.getRoomParticipants(gameData.roomId);
        const players = participants.filter(p => p.role === 'player');
        
        if (players.length < 2) {
          return res.status(400).json({ message: "Need 2 players to start online game" });
        }
        
        // Assign players: current user as X, other player as O
        const otherPlayer = players.find(p => p.userId !== userId);
        if (!otherPlayer) {
          return res.status(400).json({ message: "Could not find opponent" });
        }
        
        gameCreateData = {
          ...gameData,
          playerXId: userId,
          playerOId: otherPlayer.userId,
        };
      } else {
        // Pass-play mode: current user starts as X, O will be filled in during play
        gameCreateData = {
          ...gameData,
          playerXId: userId,
          playerOId: gameData.playerOId || undefined,
        };
      }
      
      const game = await storage.createGame(gameCreateData);
      
      // Get player information for the game
      const playerXInfo = await storage.getUser(game.playerXId);
      const playerOInfo = game.playerOId && game.playerOId !== 'AI' ? await storage.getUser(game.playerOId) : null;
      
      const gameWithPlayers = {
        ...game,
        playerXInfo,
        playerOInfo: playerOInfo || { 
          id: 'AI', 
          firstName: 'AI', 
          lastName: 'Player',
          profileImageUrl: null 
        }
      };
      
      // Update room status
      if (gameData.roomId) {
        await storage.updateRoomStatus(gameData.roomId, 'playing');
        
        // Broadcast game start to all room participants
        if (roomConnections.has(gameData.roomId)) {
          const roomUsers = roomConnections.get(gameData.roomId)!;
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'game_started',
                game: gameWithPlayers,
                roomId: gameData.roomId,
              }));
            }
          });
        }
      }

      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error creating game:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create game", error: error.message });
    }
  });

  app.get('/api/games/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const game = await storage.getGameById(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Get player information for the game
      const playerXInfo = await storage.getUser(game.playerXId);
      const playerOInfo = game.playerOId !== 'AI' ? await storage.getUser(game.playerOId) : null;
      
      const gameWithPlayers = {
        ...game,
        playerXInfo,
        playerOInfo: playerOInfo || { username: 'AI', displayName: 'AI' }
      };
      
      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post('/api/games/:id/moves', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id: gameId } = req.params;
      const { position } = req.body;

      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.status !== 'active') {
        return res.status(400).json({ message: "Game is not active" });
      }

      // Validate it's the player's turn
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;
      
      console.log('Move validation:', {
        userId,
        gameId,
        playerXId: game.playerXId,
        playerOId: game.playerOId,
        currentPlayer: game.currentPlayer,
        isPlayerX,
        isPlayerO
      });
      
      if (!isPlayerX && !isPlayerO) {
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';
      if (game.currentPlayer !== playerSymbol) {
        return res.status(400).json({ message: "Not your turn" });
      }

      // Validate move
      const currentBoard = game.board as Record<string, string> || {};
      if (!validateMove(currentBoard, position, playerSymbol)) {
        return res.status(400).json({ message: "Invalid move" });
      }

      // Make move
      const newBoard = makeMove(currentBoard, position, playerSymbol);
      const moveCount = await storage.getGameMoves(gameId);
      
      // Save move
      await storage.createMove({
        gameId,
        playerId: userId,
        position,
        symbol: playerSymbol,
        moveNumber: moveCount.length + 1,
      });

      // Update board
      await storage.updateGameBoard(gameId, newBoard);

      // Check for win
      const winResult = checkWin(newBoard, playerSymbol);
      if (winResult.winner) {
        await storage.updateGameStatus(gameId, 'finished', userId, winResult.condition || undefined);
        await storage.updateUserStats(userId, 'win');
        const opponentId = isPlayerX ? game.playerOId : game.playerXId;
        if (opponentId && opponentId !== 'AI') {
          await storage.updateUserStats(opponentId, 'loss');
        }
        
        // Update room status
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'finished');
        }
        
        // Broadcast game over to room
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'game_over',
                gameId,
                winner: userId,
                condition: winResult.condition,
                board: newBoard,
              }));
            }
          });
        }
      } else if (checkDraw(newBoard)) {
        await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
        if (game.playerXId && game.playerXId !== 'AI') await storage.updateUserStats(game.playerXId, 'draw');
        if (game.playerOId && game.playerOId !== 'AI') await storage.updateUserStats(game.playerOId, 'draw');
        
        // Update room status
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'finished');
        }
        
        // Broadcast game over to room
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'game_over',
                gameId,
                winner: null,
                condition: 'draw',
                board: newBoard,
              }));
            }
          });
        }
      } else {
        // Switch turns
        const nextPlayer = getOpponentSymbol(playerSymbol);
        await storage.updateCurrentPlayer(gameId, nextPlayer);
        
        // Handle AI move if it's AI mode
        if (game.gameMode === 'ai' && nextPlayer === 'O') {
          setTimeout(async () => {
            try {
              const ai = new AIPlayer('O', 'medium');
              const aiMove = ai.makeMove(newBoard);
              
              const aiBoard = makeMove(newBoard, aiMove, 'O');
              
              // Save AI move
              await storage.createMove({
                gameId,
                playerId: game.playerOId || 'AI',
                position: aiMove,
                symbol: 'O',
                moveNumber: moveCount.length + 2,
              });
              
              await storage.updateGameBoard(gameId, aiBoard);
              
              // Check AI win
              const aiWinResult = checkWin(aiBoard, 'O');
              if (aiWinResult.winner) {
                await storage.updateGameStatus(gameId, 'finished', game.playerOId || undefined, aiWinResult.condition || undefined);
                await storage.updateUserStats(userId, 'loss');
                
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'finished');
                }
                
                // Broadcast AI win to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify({
                        type: 'game_over',
                        gameId,
                        winner: game.playerOId || 'AI',
                        condition: aiWinResult.condition,
                        board: aiBoard,
                      }));
                    }
                  });
                }
              } else if (checkDraw(aiBoard)) {
                await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
                await storage.updateUserStats(userId, 'draw');
                
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'finished');
                }
                
                // Broadcast AI draw to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify({
                        type: 'game_over',
                        gameId,
                        winner: null,
                        condition: 'draw',
                        board: aiBoard,
                      }));
                    }
                  });
                }
              } else {
                await storage.updateCurrentPlayer(gameId, 'X');
              }
              
              // Broadcast AI move
              if (game.roomId && roomConnections.has(game.roomId)) {
                const roomUsers = roomConnections.get(game.roomId)!;
                roomUsers.forEach(connectionId => {
                  const connection = connections.get(connectionId);
                  if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify({
                      type: 'ai_move',
                      gameId,
                      position: aiMove,
                      board: aiBoard,
                    }));
                  }
                });
              }
            } catch (error) {
              console.error("AI move error:", error);
            }
          }, 1000); // 1 second delay for AI move
        }
      }

      // Broadcast move to room
      if (game.roomId && roomConnections.has(game.roomId)) {
        const roomUsers = roomConnections.get(game.roomId)!;
        roomUsers.forEach(connectionId => {
          const connection = connections.get(connectionId);
          if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({
              type: 'move',
              gameId,
              position,
              player: playerSymbol,
              board: newBoard,
            }));
          }
        });
      }

      res.json({ message: "Move made successfully" });
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  app.get('/api/users/:id/stats', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getUserStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            connections.set(connectionId, {
              ws,
              userId: data.userId,
            });
            break;
            
          case 'join_room':
            const connection = connections.get(connectionId);
            if (connection) {
              connection.roomId = data.roomId;
              if (!roomConnections.has(data.roomId)) {
                roomConnections.set(data.roomId, new Set());
              }
              roomConnections.get(data.roomId)!.add(connectionId);
              
              // Notify all participants in the room about the new connection
              const roomConnIds = roomConnections.get(data.roomId);
              if (roomConnIds) {
                for (const connId of roomConnIds) {
                  const conn = connections.get(connId);
                  if (conn && conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'user_joined',
                      userId: connection.userId,
                      roomId: data.roomId,
                    }));
                  }
                }
              }
            }
            break;
            
          case 'leave_room':
            const conn = connections.get(connectionId);
            if (conn && conn.roomId) {
              const roomUsers = roomConnections.get(conn.roomId);
              if (roomUsers) {
                roomUsers.delete(connectionId);
                if (roomUsers.size === 0) {
                  roomConnections.delete(conn.roomId);
                }
              }
              conn.roomId = undefined;
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      const connection = connections.get(connectionId);
      if (connection && connection.roomId) {
        const roomUsers = roomConnections.get(connection.roomId);
        if (roomUsers) {
          roomUsers.delete(connectionId);
          if (roomUsers.size === 0) {
            roomConnections.delete(connection.roomId);
          }
        }
      }
      connections.delete(connectionId);
    });
  });

  return httpServer;
}
