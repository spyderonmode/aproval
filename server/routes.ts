import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
  await setupAuth(app);

  const connections = new Map<string, WSConnection>();
  const roomConnections = new Map<string, Set<string>>();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Room routes
  app.post('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/rooms/:code/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.params;
      const { role = 'player' } = req.body;

      const room = await storage.getRoomByCode(code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const participants = await storage.getRoomParticipants(room.id);
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

  app.get('/api/rooms/:id/participants', isAuthenticated, async (req, res) => {
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
  app.post('/api/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameData = insertGameSchema.parse(req.body);
      
      const game = await storage.createGame(gameData);
      
      // Update room status
      if (gameData.roomId) {
        await storage.updateRoomStatus(gameData.roomId, 'playing');
      }

      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.get('/api/games/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const game = await storage.getGameById(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post('/api/games/:id/moves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        if (opponentId) {
          await storage.updateUserStats(opponentId, 'loss');
        }
        
        // Update room status
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'finished');
        }
      } else if (checkDraw(newBoard)) {
        await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
        if (game.playerXId) await storage.updateUserStats(game.playerXId, 'draw');
        if (game.playerOId) await storage.updateUserStats(game.playerOId, 'draw');
        
        // Update room status
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'finished');
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
              } else if (checkDraw(aiBoard)) {
                await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
                await storage.updateUserStats(userId, 'draw');
                
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'finished');
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

  app.get('/api/users/:id/stats', isAuthenticated, async (req, res) => {
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
