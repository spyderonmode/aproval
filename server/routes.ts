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
  username?: string;
  displayName?: string;
  lastSeen?: Date;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  const connections = new Map<string, WSConnection>();
  const roomConnections = new Map<string, Set<string>>();
  const matchmakingQueue: string[] = []; // Queue of user IDs waiting for matches
  const onlineUsers = new Map<string, { userId: string; username: string; displayName: string; roomId?: string; lastSeen: Date }>();
  const userRoomStates = new Map<string, { roomId: string; gameId?: string; isInGame: boolean }>();

  // Error logging endpoint
  app.post('/api/error-log', (req, res) => {
    const { error, stack, info } = req.body;
    console.error('🚨 FRONTEND ERROR CAUGHT:', error);
    console.error('🚨 ERROR STACK:', stack);
    console.error('🚨 ERROR INFO:', info);
    res.json({ success: true });
  });

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

  // Online game stats route for current user
  app.get('/api/users/online-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      console.log('Fetching online stats for current user:', userId);
      const stats = await storage.getOnlineGameStats(userId);
      console.log('Retrieved stats:', stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching online game stats:", error);
      res.status(500).json({ message: "Failed to fetch online game stats" });
    }
  });

  // Online game stats route for specific user
  app.get('/api/users/:id/online-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      console.log('Fetching online stats for user:', userId);
      const stats = await storage.getOnlineGameStats(userId);
      console.log('Retrieved stats:', stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching online game stats:", error);
      res.status(500).json({ message: "Failed to fetch online game stats" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get('/api/users/:id/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Theme routes
  app.get('/api/themes', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const themes = await storage.getUserThemes(userId);
      
      // Add default themes that are always available
      const defaultThemes = [
        { id: 'default', name: 'Default', unlocked: true },
        { id: 'neon', name: 'Neon', unlocked: true },
        { id: 'autumn', name: 'Autumn', unlocked: true },
        { id: 'minimalist', name: 'Minimalist', unlocked: true },
        { id: 'nature', name: 'Nature', unlocked: true },
        { id: 'space', name: 'Space', unlocked: true },
      ];
      
      // Add special themes based on unlocked themes
      const specialThemes = [
        { id: 'halloween', name: 'Halloween', unlocked: await storage.isThemeUnlocked(userId, 'halloween') },
        { id: 'christmas', name: 'Christmas', unlocked: await storage.isThemeUnlocked(userId, 'christmas') },
        { id: 'summer', name: 'Summer', unlocked: await storage.isThemeUnlocked(userId, 'summer') },
      ];
      
      res.json({
        defaultThemes,
        specialThemes,
        unlockedThemes: themes
      });
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.post('/api/themes/:name/unlock', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { name } = req.params;
      
      // Check if theme can be unlocked (for admin testing)
      const theme = await storage.unlockTheme(userId, name);
      res.json({ message: "Theme unlocked successfully", theme });
    } catch (error) {
      console.error("Error unlocking theme:", error);
      res.status(500).json({ message: "Failed to unlock theme" });
    }
  });

  // Player rankings route
  app.get('/api/rankings', requireAuth, async (req: any, res) => {
    try {
      const sortBy = req.query.sortBy || 'winRate';
      const rankings = await storage.getPlayerRankings(sortBy as string);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching player rankings:", error);
      res.status(500).json({ message: "Failed to fetch player rankings" });
    }
  });

  // Get online users
  app.get('/api/users/online', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.session.user.userId;
      const onlineUsersList = Array.from(onlineUsers.values())
        .filter(user => user.userId !== currentUserId);
      
      // Get complete user information from database with achievements
      const usersWithProfiles = await Promise.all(
        onlineUsersList.map(async (user) => {
          const userInfo = await storage.getUser(user.userId);
          const achievements = await storage.getUserAchievements(user.userId);
          return {
            userId: user.userId,
            username: userInfo?.username || user.username,
            displayName: userInfo?.displayName || userInfo?.firstName || user.displayName,
            firstName: userInfo?.firstName,
            profilePicture: userInfo?.profilePicture,
            profileImageUrl: userInfo?.profileImageUrl,
            inRoom: !!user.roomId,
            lastSeen: user.lastSeen,
            achievements: achievements.slice(0, 3) // Show top 3 achievements
          };
        })
      );
      
      res.json({
        total: usersWithProfiles.length,
        users: usersWithProfiles
      });
    } catch (error) {
      console.error("Error fetching online users:", error);
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  // Block user endpoint
  app.post('/api/users/block', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const blockerId = req.session.user.userId;
      
      if (blockerId === userId) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }
      
      await storage.blockUser(blockerId, userId);
      res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  // Unblock user endpoint
  app.post('/api/users/unblock', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const blockerId = req.session.user.userId;
      
      await storage.unblockUser(blockerId, userId);
      res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Get blocked users endpoint
  app.get('/api/users/blocked', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const blockedUsers = await storage.getBlockedUsers(userId);
      res.json(blockedUsers);
    } catch (error) {
      console.error("Error getting blocked users:", error);
      res.status(500).json({ message: "Failed to get blocked users" });
    }
  });

  // Send chat message
  app.post('/api/chat/send', requireAuth, async (req: any, res) => {
    try {
      const { targetUserId, message } = req.body;
      const senderId = req.session.user.userId;

      // Check if sender is blocked by target user
      const isBlocked = await storage.isUserBlocked(targetUserId, senderId);
      if (isBlocked) {
        return res.status(403).json({ error: 'You are blocked by this user' });
      }

      // Check if target user is blocked by sender
      const hasBlocked = await storage.isUserBlocked(senderId, targetUserId);
      if (hasBlocked) {
        return res.status(403).json({ error: 'You have blocked this user' });
      }
      
      // Get sender info (from onlineUsers or fetch from database)
      let senderInfo = onlineUsers.get(senderId);
      if (!senderInfo) {
        // If not in onlineUsers, get from database for in-game users
        const senderData = await storage.getUser(senderId);
        if (!senderData) {
          return res.status(400).json({ error: 'Sender not found' });
        }
        senderInfo = {
          userId: senderId,
          username: senderData.username || senderData.id,
          displayName: senderData.displayName || senderData.firstName || senderData.username,
          roomId: undefined,
          lastSeen: new Date()
        };
        console.log(`📨 Using database info for in-game sender: ${senderId}`);
      }

      // Find ALL connections for target user (they might have multiple connections)
      const targetConnections = Array.from(connections.values()).filter(conn => conn.userId === targetUserId);
      if (targetConnections.length === 0) {
        return res.status(400).json({ error: 'Target user connection not found' });
      }

      // Send to all active connections for the target user
      let messageSent = false;
      for (const targetConnection of targetConnections) {
        if (targetConnection.ws && targetConnection.ws.readyState === WebSocket.OPEN) {
          targetConnection.ws.send(JSON.stringify({
            type: 'chat_message_received',
            message: {
              senderId,
              senderName: senderInfo.displayName || senderInfo.username,
              message,
              timestamp: new Date().toISOString()
            }
          }));
          messageSent = true;
        }
      }

      if (!messageSent) {
        return res.status(400).json({ error: 'Target user connection is not active' });
      }

      console.log(`📨 Chat message sent from ${senderId} to ${targetUserId}: ${message}`);

      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // Online matchmaking endpoint
  app.post('/api/matchmaking/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      
      // Check if user is already in queue
      if (matchmakingQueue.includes(userId)) {
        return res.json({ status: 'waiting', message: 'Already in matchmaking queue' });
      }
      
      // Add to queue
      matchmakingQueue.push(userId);
      console.log(`🎯 User ${userId} joined matchmaking queue. Queue size: ${matchmakingQueue.length}`);
      
      // Check if we can make a match (need 2 players)
      if (matchmakingQueue.length >= 2) {
        // Remove two players from queue
        const player1Id = matchmakingQueue.shift()!;
        const player2Id = matchmakingQueue.shift()!;
        
        console.log(`🎯 Match found! Pairing ${player1Id} vs ${player2Id}`);
        
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
        
        // Notify both players via WebSocket with the same message type
        const notifyPlayer = async (playerId: string) => {
          // Find connection by userId
          for (const [connId, connection] of connections.entries()) {
            if (connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'match_found',
                room: room,
                message: 'Match found! Joining room...'
              }));
              break;
            }
          }
        };
        
        await notifyPlayer(player1Id);
        await notifyPlayer(player2Id);
        
        console.log(`🎯 Match notifications sent to both players`);
        
        // Return matched status to the player who just joined
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
      const userId = req.session.user.userId;
      const index = matchmakingQueue.indexOf(userId);
      if (index > -1) {
        matchmakingQueue.splice(index, 1);
        console.log(`🎯 User ${userId} left matchmaking queue. Queue size: ${matchmakingQueue.length}`);
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
      const userId = req.session.user.userId;
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
      const userId = req.session.user.userId;
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

      // Check if room is full (only for players, spectators can always join)
      const playerCount = participants.filter(p => p.role === 'player').length;
      if (role === 'player' && playerCount >= 2) {
        return res.status(400).json({ message: "Room is full" });
      }
      
      // Check spectator limit - allow up to 50 spectators per room
      const maxSpectators = 50;
      const spectatorCount = participants.filter(p => p.role === 'spectator').length;
      
      if (role === 'spectator' && spectatorCount >= maxSpectators) {
        return res.status(400).json({ message: "Spectator limit reached" });
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

  // Start game in a room
  app.post('/api/rooms/:roomId/start-game', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { roomId } = req.params;
      
      console.log('🎮 Room start-game request:', { roomId, userId });
      
      // Get the room to verify it exists
      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Check if user is a player in the room (both players can start games)
      const participants = await storage.getRoomParticipants(roomId);
      const isPlayer = participants.some(p => p.userId === userId && p.role === 'player');
      if (!isPlayer) {
        return res.status(403).json({ message: "Only players can start games" });
      }
      
      // Check if there's already an active game in this room
      const existingGame = await storage.getActiveGameByRoomId(roomId);
      if (existingGame && existingGame.status === 'active') {
        console.log('🎮 Active game already exists, ending it first');
        // End the existing game
        await storage.updateGameStatus(existingGame.id, 'finished');
      }
      
      // Get room participants (reuse from above)
      const players = participants.filter(p => p.role === 'player');
      
      if (players.length < 2) {
        return res.status(400).json({ message: "Need 2 players to start game" });
      }
      
      // Create new game with consistent player assignments
      const sortedPlayers = players.sort((a, b) => a.userId.localeCompare(b.userId));
      const playerX = sortedPlayers[0];
      const playerO = sortedPlayers[1];
      
      if (!playerX || !playerO) {
        return res.status(400).json({ message: "Could not find both players" });
      }
      
      const gameData = {
        roomId,
        playerXId: playerX.userId,
        playerOId: playerO.userId,
        gameMode: 'online' as const,
        status: 'active' as const,
        currentPlayer: 'X' as const,
        board: {},
      };
      
      const game = await storage.createGame(gameData);
      console.log('🎮 New game created:', game.id);
      
      // Get player information with achievements
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        storage.getUser(game.playerOId)
      ]);
      
      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
      ]);
      
      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3)
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3)
        } : playerOInfo,
      };
      
      // Broadcast to all room participants
      if (roomConnections.has(roomId)) {
        const roomUsers = roomConnections.get(roomId)!;
        console.log(`🎮 Broadcasting game_started to ${roomUsers.size} users in room ${roomId}`);
        
        roomUsers.forEach(connectionId => {
          const connection = connections.get(connectionId);
          if (connection && connection.ws.readyState === WebSocket.OPEN) {
            console.log(`🎮 Sending game_started to user: ${connection.userId}`);
            connection.ws.send(JSON.stringify({
              type: 'game_started',
              game: gameWithPlayers,
              gameId: game.id,
              roomId: roomId,
            }));
          }
        });
      }
      
      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error starting room game:", error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Game routes
  app.post('/api/games', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
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
        // Online mode: check if a game already exists for this room
        const existingGame = await storage.getActiveGameByRoomId(gameData.roomId);
        if (existingGame) {
          console.log('🎮 Game already exists for room:', existingGame.id);
          // Get player information for the existing game with achievements
          const [playerXInfo, playerOInfo] = await Promise.all([
            storage.getUser(existingGame.playerXId),
            existingGame.playerOId && existingGame.playerOId !== 'AI' ? storage.getUser(existingGame.playerOId) : Promise.resolve(null)
          ]);
          
          // Get achievements for both players
          const [playerXAchievements, playerOAchievements] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(existingGame.playerXId) : Promise.resolve([]),
            playerOInfo ? storage.getUserAchievements(existingGame.playerOId) : Promise.resolve([])
          ]);
          
          const gameWithPlayers = {
            ...existingGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3)
            } : playerXInfo,
            playerOInfo: playerOInfo ? {
              ...playerOInfo,
              achievements: playerOAchievements.slice(0, 3)
            } : { 
              id: 'AI', 
              firstName: 'AI', 
              lastName: 'Player',
              profileImageUrl: null 
            }
          };
          
          // Reset game state and broadcast to ensure clean start
          await storage.updateGameBoard(existingGame.id, {});
          await storage.updateCurrentPlayer(existingGame.id, 'X');
          
          // Get fresh game state after reset
          const refreshedGame = await storage.getGameById(existingGame.id);
          const refreshedGameWithPlayers = {
            ...refreshedGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3)
            } : playerXInfo,
            playerOInfo: playerOInfo ? {
              ...playerOInfo,
              achievements: playerOAchievements.slice(0, 3)
            } : { 
              id: 'AI', 
              firstName: 'AI', 
              lastName: 'Player',
              profileImageUrl: null 
            }
          };
          
          console.log('🎮 Broadcasting game_started for refreshed game to room:', gameData.roomId);
          if (roomConnections.has(gameData.roomId)) {
            const roomUsers = roomConnections.get(gameData.roomId)!;
            console.log(`🎮 Broadcasting to ${roomUsers.size} users in room`);
            roomUsers.forEach(connectionId => {
              const connection = connections.get(connectionId);
              if (connection && connection.ws.readyState === WebSocket.OPEN) {
                console.log(`🎮 Sending game_started to user: ${connection.userId}`);
                connection.ws.send(JSON.stringify({
                  type: 'game_started',
                  game: refreshedGameWithPlayers,
                  gameId: refreshedGame.id,
                  roomId: gameData.roomId,
                }));
              }
            });
          }
          
          return res.json(refreshedGameWithPlayers);
        }
        
        // Get room participants and assign as players
        const participants = await storage.getRoomParticipants(gameData.roomId);
        const players = participants.filter(p => p.role === 'player');
        
        if (players.length < 2) {
          return res.status(400).json({ message: "Need 2 players to start online game" });
        }
        
        // Assign players consistently: sort by userId to ensure same assignment every time
        const sortedPlayers = players.sort((a, b) => a.userId.localeCompare(b.userId));
        const playerX = sortedPlayers[0];
        const playerO = sortedPlayers[1];
        
        if (!playerX || !playerO) {
          return res.status(400).json({ message: "Could not find both players" });
        }
        
        gameCreateData = {
          ...gameData,
          playerXId: playerX.userId,
          playerOId: playerO.userId,
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
      
      // Get player information with achievements for the game
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        game.playerOId && game.playerOId !== 'AI' ? storage.getUser(game.playerOId) : Promise.resolve(null)
      ]);
      
      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
      ]);
      
      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3)
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3)
        } : { 
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
        console.log('🎮 Broadcasting game_started for new game to room:', gameData.roomId);
        if (roomConnections.has(gameData.roomId)) {
          const roomUsers = roomConnections.get(gameData.roomId)!;
          console.log(`🎮 Broadcasting to ${roomUsers.size} users in room`);
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              console.log(`🎮 Sending game_started to user: ${connection.userId}`);
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
      
      // Get player information with achievements for the game
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        game.playerOId !== 'AI' ? storage.getUser(game.playerOId) : Promise.resolve(null)
      ]);
      
      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
      ]);
      
      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3)
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3)
        } : { username: 'AI', displayName: 'AI' }
      };
      
      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post('/api/games/:id/moves', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { id: gameId } = req.params;
      const { position } = req.body;

      console.log(`\n=== MOVE REQUEST ===`);
      console.log(`Game ID: ${gameId}`);
      console.log(`User ID: ${userId}`);
      console.log(`Position: ${position}`);

      // Always fetch fresh game state to avoid stale data
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      console.log(`Current game state (fresh from DB):`);
      console.log(`- Player X: ${game.playerXId}`);
      console.log(`- Player O: ${game.playerOId}`);
      console.log(`- Current player: ${game.currentPlayer}`);
      console.log(`- Board: ${JSON.stringify(game.board)}`);

      if (game.status !== 'active') {
        console.log(`❌ MOVE REJECTED: Game status is ${game.status}, not active`);
        return res.status(400).json({ message: `Game is not active (status: ${game.status})` });
      }

      // Validate it's the player's turn
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;
      
      console.log(`- Is Player X: ${isPlayerX}`);
      console.log(`- Is Player O: ${isPlayerO}`);
      
      if (!isPlayerX && !isPlayerO) {
        console.log(`❌ MOVE REJECTED: User ${userId} is not a player in this game`);
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';
      console.log(`- Player symbol: ${playerSymbol}`);
      console.log(`- Turn validation: ${game.currentPlayer} === ${playerSymbol} ? ${game.currentPlayer === playerSymbol}`);
      
      if (game.currentPlayer !== playerSymbol) {
        console.log(`❌ MOVE REJECTED: Not your turn. Current: ${game.currentPlayer}, User: ${playerSymbol}`);
        return res.status(400).json({ 
          message: `Not your turn. Current player: ${game.currentPlayer}, Your symbol: ${playerSymbol}`,
          debug: {
            userId,
            playerXId: game.playerXId,
            playerOId: game.playerOId,
            currentPlayer: game.currentPlayer,
            isPlayerX,
            isPlayerO,
            playerSymbol
          }
        });
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
        
        // Check and grant achievements for the winner (only for online games)
        if (game.roomId && game.gameMode === 'online') {
          console.log(`🏆 Checking achievements for winner: ${userId} in online game`);
          try {
            const newAchievements = await storage.checkAndGrantAchievements(userId, 'win', {
              winCondition: winResult.condition,
              isOnlineGame: true
            });
            console.log(`🏆 Granted ${newAchievements.length} new achievements:`, newAchievements.map(a => a.achievementName));
          } catch (error) {
            console.error('🏆 Error checking achievements for winner:', error);
          }
          
          // Check and grant achievements for the loser if it's not AI
          if (opponentId && opponentId !== 'AI') {
            try {
              await storage.checkAndGrantAchievements(opponentId, 'loss', {
                winCondition: winResult.condition,
                isOnlineGame: true
              });
            } catch (error) {
              console.error('🏆 Error checking achievements for loser:', error);
            }
          }
        }
        
        // Update room status
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'finished');
        }
        
        // Broadcast game over to room with winner info after 2-3 second delay
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;
          // Get winner profile information
          const winnerInfo = await storage.getUser(userId);
          
          // First broadcast the winning move with highlight
          const nextPlayer = playerSymbol === 'X' ? 'O' : 'X';
          const moveMessage = JSON.stringify({
            type: 'winning_move',
            gameId,
            position,
            player: playerSymbol,
            board: newBoard,
            currentPlayer: nextPlayer,
            winningPositions: winResult.winningPositions || [],
            roomId: game.roomId
          });
          
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(moveMessage);
            }
          });
          
          // Then broadcast game over after 2.5 seconds
          setTimeout(async () => {
            // Get both player information
            const playerXInfo = await storage.getUser(game.playerXId);
            const playerOInfo = game.playerOId !== 'AI' ? await storage.getUser(game.playerOId) : null;
            
            roomUsers.forEach(connectionId => {
              const connection = connections.get(connectionId);
              if (connection && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify({
                  type: 'game_over',
                  gameId,
                  winner: playerSymbol, // Send the symbol (X or O) instead of userId
                  condition: winResult.condition,
                  board: newBoard,
                  winnerInfo: winnerInfo ? {
                    displayName: winnerInfo.displayName,
                    firstName: winnerInfo.firstName,
                    username: winnerInfo.username,
                    profilePicture: winnerInfo.profilePicture,
                    profileImageUrl: winnerInfo.profileImageUrl
                  } : null,
                  playerXInfo: playerXInfo ? {
                    displayName: playerXInfo.displayName,
                    firstName: playerXInfo.firstName,
                    username: playerXInfo.username,
                    profilePicture: playerXInfo.profilePicture,
                    profileImageUrl: playerXInfo.profileImageUrl
                  } : null,
                  playerOInfo: playerOInfo ? {
                    displayName: playerOInfo.displayName,
                    firstName: playerOInfo.firstName,
                    username: playerOInfo.username,
                    profilePicture: playerOInfo.profilePicture,
                    profileImageUrl: playerOInfo.profileImageUrl
                  } : null
                }));
              }
            });
          }, 2500);
        }
      } else if (checkDraw(newBoard)) {
        await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
        if (game.playerXId && game.playerXId !== 'AI') await storage.updateUserStats(game.playerXId, 'draw');
        if (game.playerOId && game.playerOId !== 'AI') await storage.updateUserStats(game.playerOId, 'draw');
        
        // Check and grant achievements for both players (they drew) - only for online games
        if (game.roomId && game.gameMode === 'online') {
          if (game.playerXId && game.playerXId !== 'AI') {
            try {
              await storage.checkAndGrantAchievements(game.playerXId, 'draw', {
                winCondition: 'draw',
                isOnlineGame: true
              });
            } catch (error) {
              console.error('🏆 Error checking achievements for playerX (draw):', error);
            }
          }
          if (game.playerOId && game.playerOId !== 'AI') {
            try {
              await storage.checkAndGrantAchievements(game.playerOId, 'draw', {
                winCondition: 'draw',
                isOnlineGame: true
              });
            } catch (error) {
              console.error('🏆 Error checking achievements for playerO (draw):', error);
            }
          }
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
        
        console.log(`✅ MOVE SUCCESSFUL: ${playerSymbol} at position ${position}`);
        console.log(`- Next player: ${nextPlayer}`);
        console.log(`- Broadcasting to room: ${game.roomId}`);
        
        // Broadcast move to room AFTER updating current player (INCLUDING SPECTATORS)
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;
          
          // Get player information with achievements for the move broadcast (parallel fetch for speed)
          const [playerXInfo, playerOInfo] = await Promise.all([
            storage.getUser(game.playerXId),
            game.playerOId !== 'AI' ? storage.getUser(game.playerOId) : Promise.resolve(null)
          ]);
          
          // Get achievements for both players
          const [playerXAchievements, playerOAchievements] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
            playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
          ]);
          
          // Prepare the message once to avoid JSON.stringify overhead
          const moveMessage = JSON.stringify({
            type: 'move',
            gameId,
            roomId: game.roomId,
            position,
            player: playerSymbol,
            board: newBoard,
            currentPlayer: nextPlayer,
            playerXInfo: playerXInfo ? {
              displayName: playerXInfo.displayName,
              firstName: playerXInfo.firstName,
              username: playerXInfo.username,
              profilePicture: playerXInfo.profilePicture,
              profileImageUrl: playerXInfo.profileImageUrl,
              achievements: playerXAchievements.slice(0, 3)
            } : null,
            playerOInfo: playerOInfo ? {
              displayName: playerOInfo.displayName,
              firstName: playerOInfo.firstName,
              username: playerOInfo.username,
              profilePicture: playerOInfo.profilePicture,
              profileImageUrl: playerOInfo.profileImageUrl,
              achievements: playerOAchievements.slice(0, 3)
            } : null
          });
          
          // Faster broadcast without extensive logging
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(moveMessage);
            }
          });
        }
        
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
                
                // AI games don't grant achievements (only online games do)
                
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
                
                // AI games don't grant achievements (only online games do)
                
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
                      type: 'move',
                      gameId,
                      position: aiMove,
                      player: 'O',
                      board: aiBoard,
                      currentPlayer: 'X', // Back to player X's turn after AI move
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

      res.json({ 
        message: "Move made successfully",
        board: newBoard,
        currentPlayer: getOpponentSymbol(playerSymbol),
        gameId: gameId
      });
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
    console.log(`🔗 New WebSocket connection: ${connectionId}`);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            console.log(`🔐 WebSocket auth: ${data.userId} -> ${connectionId}`);
            
            // Get user info for online tracking
            const userInfo = await storage.getUser(data.userId);
            
            connections.set(connectionId, {
              ws,
              userId: data.userId,
              username: userInfo?.username || 'Anonymous',
              displayName: userInfo?.displayName || userInfo?.firstName || 'Anonymous',
              lastSeen: new Date()
            });
            
            // Update online users list
            onlineUsers.set(data.userId, {
              userId: data.userId,
              username: userInfo?.username || 'Anonymous',
              displayName: userInfo?.displayName || userInfo?.firstName || 'Anonymous',
              lastSeen: new Date()
            });
            
            // Broadcast updated online count to all connected users
            const onlineCount = onlineUsers.size;
            const broadcastMessage = JSON.stringify({
              type: 'online_users_update',
              count: onlineCount
            });
            
            connections.forEach(conn => {
              if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(broadcastMessage);
              }
            });
            
            break;
            
          case 'join_room':
            const connection = connections.get(connectionId);
            if (connection) {
              console.log(`🏠 User ${connection.userId} joining room ${data.roomId} via connection ${connectionId}`);
              connection.roomId = data.roomId;
              
              // Update user's room state
              const existingState = userRoomStates.get(connection.userId);
              const activeGame = await storage.getActiveGameByRoomId(data.roomId);
              
              userRoomStates.set(connection.userId, {
                roomId: data.roomId,
                gameId: activeGame?.id,
                isInGame: activeGame?.status === 'active'
              });
              
              // Update online user room info
              const onlineUser = onlineUsers.get(connection.userId);
              if (onlineUser) {
                onlineUser.roomId = data.roomId;
              }
              
              if (!roomConnections.has(data.roomId)) {
                roomConnections.set(data.roomId, new Set());
              }
              roomConnections.get(data.roomId)!.add(connectionId);
              console.log(`🏠 Room ${data.roomId} now has ${roomConnections.get(data.roomId)?.size} connections`);
              
              // Notify all participants in the room about the new connection
              const roomConnIds = roomConnections.get(data.roomId);
              if (roomConnIds) {
                // Get user information for the joining user
                const userInfo = await storage.getUser(connection.userId);
                
                for (const connId of roomConnIds) {
                  const conn = connections.get(connId);
                  if (conn && conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'user_joined',
                      userId: connection.userId,
                      roomId: data.roomId,
                      userInfo: userInfo,
                    }));
                  }
                }
              }
            }
            break;
            
          case 'leave_room':
            const conn = connections.get(connectionId);
            if (conn && conn.roomId) {
              const roomId = conn.roomId;
              const { userId, playerName } = data;
              
              console.log(`🏠 Processing leave_room message for ${playerName} in room ${roomId}`);
              
              // Check if user is in an active game - if so, don't remove them yet
              const userState = userRoomStates.get(userId);
              const activeGame = await storage.getActiveGameByRoomId(roomId);
              
              if (activeGame && activeGame.status === 'active' && 
                  (activeGame.playerXId === userId || activeGame.playerOId === userId)) {
                console.log(`🏠 User ${playerName} is in active game - not removing from room yet`);
                // Don't remove from room, just mark as temporarily disconnected
                const onlineUser = onlineUsers.get(userId);
                if (onlineUser) {
                  onlineUser.lastSeen = new Date();
                }
                return;
              }
              
              // Remove from room connections
              const roomUsers = roomConnections.get(roomId);
              if (roomUsers) {
                roomUsers.delete(connectionId);
                
                // Update online user room info
                const onlineUser = onlineUsers.get(userId);
                if (onlineUser) {
                  onlineUser.roomId = undefined;
                }
                
                // Remove from user room states
                userRoomStates.delete(userId);
                
                // Send room end notification to all remaining users
                if (roomUsers.size > 0) {
                  const roomEndMessage = JSON.stringify({
                    type: 'room_ended',
                    roomId,
                    userId,
                    playerName,
                    message: `${playerName} left the room`
                  });
                  
                  console.log(`🏠 Broadcasting room end to ${roomUsers.size} remaining users`);
                  roomUsers.forEach(remainingConnectionId => {
                    const remainingConnection = connections.get(remainingConnectionId);
                    if (remainingConnection && remainingConnection.ws.readyState === WebSocket.OPEN) {
                      remainingConnection.ws.send(roomEndMessage);
                    }
                  });
                }
                
                // Clear the room if no users left
                if (roomUsers.size === 0) {
                  roomConnections.delete(roomId);
                  console.log(`🏠 Room ${roomId} cleared - no users remaining`);
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

    ws.on('close', async () => {
      console.log(`🔌 WebSocket connection closed: ${connectionId}`);
      
      // Get user info before cleaning up
      const connection = connections.get(connectionId);
      
      if (connection) {
        // Check if user has other active connections
        const userHasOtherConnections = Array.from(connections.values()).some(
          conn => conn.userId === connection.userId && conn.ws !== ws
        );
        
        // Only remove from online users if no other connections exist
        if (!userHasOtherConnections) {
          // Check if user is in active game - if so, don't remove them completely
          const userState = userRoomStates.get(connection.userId);
          if (userState && userState.isInGame) {
            console.log(`🏠 User ${connection.userId} disconnected but is in active game - keeping in room`);
            // Update last seen time but don't remove
            const onlineUser = onlineUsers.get(connection.userId);
            if (onlineUser) {
              onlineUser.lastSeen = new Date();
            }
          } else {
            // Remove from online users if not in active game
            onlineUsers.delete(connection.userId);
            userRoomStates.delete(connection.userId);
            
            // Broadcast user offline event for chat history cleanup
            const userOfflineMessage = JSON.stringify({
              type: 'user_offline',
              userId: connection.userId
            });
            
            // Broadcast updated online count
            const onlineCount = onlineUsers.size;
            const broadcastMessage = JSON.stringify({
              type: 'online_users_update',
              count: onlineCount
            });
            
            connections.forEach(conn => {
              if (conn.ws.readyState === WebSocket.OPEN && conn.ws !== ws) {
                conn.ws.send(userOfflineMessage);
                conn.ws.send(broadcastMessage);
              }
            });
          }
        }
      }
      
      // Clean up connection
      connections.delete(connectionId);
      
      // Remove from room connections only if user doesn't have other connections
      if (connection && !Array.from(connections.values()).some(conn => conn.userId === connection.userId)) {
        for (const [roomId, roomUsers] of roomConnections.entries()) {
          if (roomUsers.has(connectionId)) {
            roomUsers.delete(connectionId);
            
            // Check if user is in active game before notifying room end
            const userState = userRoomStates.get(connection.userId);
            const activeGame = await storage.getActiveGameByRoomId(roomId);
            
            if (!(activeGame && activeGame.status === 'active' && 
                  (activeGame.playerXId === connection.userId || activeGame.playerOId === connection.userId))) {
              // Only notify room end if user is not in active game
              const userInfo = await storage.getUser(connection.userId);
              const playerName = userInfo?.displayName || userInfo?.firstName || userInfo?.username || 'A player';
              
              const roomEndMessage = JSON.stringify({
                type: 'room_ended',
                roomId,
                userId: connection.userId,
                playerName,
                message: `${playerName} left the room`
              });
              
              // Broadcast room end to all remaining users
              roomUsers.forEach(remainingConnectionId => {
                const remainingConnection = connections.get(remainingConnectionId);
                if (remainingConnection && remainingConnection.ws.readyState === WebSocket.OPEN) {
                  remainingConnection.ws.send(roomEndMessage);
                }
              });
              
              // Clear the room if no users left
              if (roomUsers.size === 0) {
                roomConnections.delete(roomId);
                console.log(`🏠 Room ${roomId} cleared - no users remaining`);
              }
            }
          }
        }
      }
    });
  });

  return httpServer;
}
