import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertRoomSchema, insertGameSchema, insertMoveSchema, users, games, achievements } from "@shared/schema";
import { AIPlayer } from "./aiPlayer";
import { makeMove, checkWin, checkDraw, getOpponentSymbol, validateMove } from "./gameLogic";
import { db } from "./db";
import { eq, and, or, desc, exists } from "drizzle-orm";

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

  // Create room_invitations table if it doesn't exist
  try {
    await storage.createRoomInvitationsTable();
    console.log('✅ Room invitations table ready');
  } catch (error) {
    console.log('ℹ️ Room invitations table already exists or error:', error.message);
  }

  // Clean up friendship data inconsistencies
  try {
    await storage.cleanupFriendshipData();
    console.log('✅ Friendship data cleanup completed');
  } catch (error) {
    console.log('ℹ️ Friendship data cleanup error:', error.message);
  }

  const connections = new Map<string, WSConnection>();
  const roomConnections = new Map<string, Set<string>>();
  const matchmakingQueue: string[] = []; // Queue of user IDs waiting for matches
  const onlineUsers = new Map<string, { userId: string; username: string; displayName: string; roomId?: string; lastSeen: Date }>();
  const userRoomStates = new Map<string, { roomId: string; gameId?: string; isInGame: boolean }>();
  const matchmakingTimers = new Map<string, NodeJS.Timeout>(); // Track user timers for bot matches
  const recentReconnections = new Map<string, number>(); // Track recent reconnection messages to prevent duplicates
  
  // Game expiration system - check every 2 minutes
  setInterval(async () => {
    try {
      const expiredGames = await storage.getExpiredGames();
      
      for (const expiredGame of expiredGames) {
        // Game expired after inactivity
        
        // Update game status to expired
        await storage.expireGame(expiredGame.id);
        
        // Update room status back to waiting
        if (expiredGame.roomId) {
          await storage.updateRoomStatus(expiredGame.roomId, 'waiting');
        }
        
        // Notify all players in the room about expiration
        if (expiredGame.roomId && roomConnections.has(expiredGame.roomId)) {
          const roomUsers = roomConnections.get(expiredGame.roomId);
          const expirationMessage = JSON.stringify({
            type: 'game_expired',
            gameId: expiredGame.id,
            roomId: expiredGame.roomId,
            message: 'Game expired due to 10 minutes of inactivity. Returning to lobby.'
          });
          
          roomUsers?.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(expirationMessage);
            }
          });
          
          // Clear room connections
          roomConnections.delete(expiredGame.roomId);
        }
        
        // Clear user room states for expired game players
        userRoomStates.forEach((state, userId) => {
          if (state.gameId === expiredGame.id) {
            userRoomStates.delete(userId);
          }
        });
      }
    } catch (error) {
      console.error('⏰ Error checking for expired games:', error);
    }
  }, 2 * 60 * 1000); // Check every 2 minutes

  // Offline reconnection handler with expiration check
  async function handleUserReconnection(userId: string, connectionId: string, ws: WebSocket) {
    try {
      // Checking for active game reconnection
      
      // Check if user has an active game (not expired or abandoned)
      // Also check if user has any room state - if not, they were properly cleaned up from abandonment
      const userRoomState = userRoomStates.get(userId);
      const activeGame = await storage.getActiveGameForUser(userId);
      
      if (activeGame && activeGame.roomId && activeGame.status === 'active' && userRoomState) {
        // Check if game is still within 10 minute limit
        const gameAge = Date.now() - new Date(activeGame.lastMoveAt || activeGame.createdAt).getTime();
        const tenMinutes = 10 * 60 * 1000;
        
        if (gameAge > tenMinutes) {
          // Game expired - expiring now
          
          // Expire the game immediately
          await storage.expireGame(activeGame.id);
          await storage.updateRoomStatus(activeGame.roomId, 'waiting');
          
          // Send expiration message to user
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'game_expired',
              gameId: activeGame.id,
              roomId: activeGame.roomId,
              message: 'Your game has expired. Returning to lobby.'
            }));
          }
          
          // Clear user room state
          userRoomStates.delete(userId);
          return;
        }
        

        
        // Check if user already has an active reconnection in progress (within last 2 seconds)
        const now = Date.now();
        const lastReconnection = recentReconnections.get(userId);
        if (lastReconnection && (now - lastReconnection) < 2000) {

          // Still add to room connections but don't send messages
          if (!roomConnections.has(activeGame.roomId)) {
            roomConnections.set(activeGame.roomId, new Set());
          }
          roomConnections.get(activeGame.roomId)!.add(connectionId);
          const connection = connections.get(connectionId);
          if (connection) {
            connection.roomId = activeGame.roomId;
          }
          userRoomStates.set(userId, {
            roomId: activeGame.roomId,
            gameId: activeGame.id,
            isInGame: true
          });
          return;
        }
        
        // Track this user's reconnection
        recentReconnections.set(userId, now);
        
        // Add user back to room connections
        if (!roomConnections.has(activeGame.roomId)) {
          roomConnections.set(activeGame.roomId, new Set());
        }
        roomConnections.get(activeGame.roomId)!.add(connectionId);
        
        // Update connection room info
        const connection = connections.get(connectionId);
        if (connection) {
          connection.roomId = activeGame.roomId;
        }
        
        // Update user room state
        userRoomStates.set(userId, {
          roomId: activeGame.roomId,
          gameId: activeGame.id,
          isInGame: true
        });
        
        // Get complete game data with player info
        const [playerXInfo, playerOInfo] = await Promise.all([
          storage.getUser(activeGame.playerXId!),
          activeGame.playerOId && !AI_BOTS.some(bot => bot.id === activeGame.playerOId) ? storage.getUser(activeGame.playerOId!) : Promise.resolve(null)
        ]);
        
        // Get achievements for both players
        const [playerXAchievements, playerOAchievements] = await Promise.all([
          storage.getUserAchievements(activeGame.playerXId!),
          playerOInfo && !AI_BOTS.some(bot => bot.id === activeGame.playerOId) ? storage.getUserAchievements(activeGame.playerOId!) : Promise.resolve([])
        ]);
        
        // Handle bot player info
        let finalPlayerOInfo = playerOInfo;
        if (activeGame.playerOId && AI_BOTS.some(bot => bot.id === activeGame.playerOId)) {
          const botInfo = AI_BOTS.find(bot => bot.id === activeGame.playerOId);
          finalPlayerOInfo = {
            id: activeGame.playerOId,
            firstName: botInfo?.firstName || 'AI',
            lastName: botInfo?.lastName || 'Player',
            displayName: botInfo?.displayName || 'AI Player',
            username: botInfo?.username || 'ai',
            profilePicture: botInfo?.profilePicture || null,
            profileImageUrl: botInfo?.profilePicture || null,
            achievements: []
          };
        }
        
        const gameWithPlayers = {
          ...activeGame,
          playerXInfo: playerXInfo ? {
            ...playerXInfo,
            achievements: playerXAchievements.slice(0, 3)
          } : null,
          playerOInfo: finalPlayerOInfo ? {
            ...finalPlayerOInfo,
            achievements: (finalPlayerOInfo as any).achievements || playerOAchievements.slice(0, 3)
          } : null,
          gameMode: activeGame.gameMode,
          serverTime: new Date().toISOString(), // Add server time for consistent timer calculation
          timeRemaining: Math.max(0, 10 * 60 * 1000 - (Date.now() - new Date(activeGame.createdAt).getTime())) // Calculate remaining time from game start
        };
        
        // Get room info
        const room = await storage.getRoomById(activeGame.roomId);
        
        // Send reconnection messages
        if (ws.readyState === WebSocket.OPEN) {
          // First, send room join notification
          ws.send(JSON.stringify({
            type: 'reconnection_room_join',
            room: room,
            message: 'Reconnected to your game room'
          }));
          
          // Then send current game state (only once)
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'game_reconnection',
                game: gameWithPlayers,
                roomId: activeGame.roomId,
                message: 'Game state recovered successfully'
              }));
              

              
              // Clean up old reconnection tracking entries (older than 5 seconds)
              setTimeout(() => {
                const cutoff = Date.now() - 5000;
                for (const [trackingUserId, timestamp] of recentReconnections.entries()) {
                  if (timestamp < cutoff) {
                    recentReconnections.delete(trackingUserId);
                  }
                }
              }, 5000);
            }
          }, 500);
          
          // Notify other players in the room about reconnection
          const roomUsers = roomConnections.get(activeGame.roomId);
          if (roomUsers) {
            // Get the reconnecting user's info specifically
            const reconnectingUser = await storage.getUser(userId);
            const reconnectionNotification = JSON.stringify({
              type: 'player_reconnected',
              userId: userId,
              playerName: reconnectingUser?.displayName || reconnectingUser?.firstName || 'Player',
              message: `${reconnectingUser?.displayName || reconnectingUser?.firstName || 'Player'} reconnected to the game`
            });
            
            roomUsers.forEach(otherConnectionId => {
              if (otherConnectionId !== connectionId) {
                const otherConnection = connections.get(otherConnectionId);
                if (otherConnection && otherConnection.ws.readyState === WebSocket.OPEN) {
                  otherConnection.ws.send(reconnectionNotification);
                }
              }
            });
          }
        }
      } else {
        // No active game found - normal connection
      }
    } catch (error) {
      console.error(`🔄 Error handling reconnection for user ${userId}:`, error);
    }
  }

  // AI Bot System - 100 AI opponents with varied difficulties and personalities
  const REALISTIC_NAMES = [
    // English names
    "Alex Johnson", "Sarah Chen", "Michael Brown", "Emma Wilson", "David Lee", "Lisa Garcia", "Ryan Smith", "Maya Patel", "James Miller", "Sofia Rodriguez",
    "Chris Taylor", "Amanda Thompson", "Kevin Wang", "Rachel Green", "Mark Davis", "Nicole Kim", "Tyler Anderson", "Jessica Martinez", "Brandon Jones", "Ashley White",
    "Jordan Clark", "Samantha Lewis", "Austin Young", "Stephanie Hall", "Cameron Scott", "Natalie Adams", "Derek Baker", "Megan Turner", "Sean Murphy", "Lauren Cooper",
    
    // Arabic names
    "Ahmed Hassan", "Fatima Al-Zahra", "Omar Khalil", "Aisha Rahman", "Youssef Mansour", "Layla Nasser", "Kareem Ibrahim", "Nour El-Din", "Salma Farouk", "Rashid Abadi",
    "Mariam Qasemi", "Tariq Habib", "Zara Mahmoud", "Samir Hashim", "Dina Rasheed", "Jamal Khoury", "Lina Amin", "Khalil Badawi", "Rana Sharif", "Fadi Zidan",
    
    // Indian names
    "Rahul Sharma", "Priya Gupta", "Aryan Singh", "Sneha Patel", "Vikram Kumar", "Ananya Reddy", "Rohit Agarwal", "Kavya Menon", "Arjun Iyer", "Riya Joshi",
    "Siddharth Rao", "Meera Kapoor", "Aarav Malik", "Pooja Nair", "Karan Thakur", "Shreya Verma", "Nikhil Bansal", "Divya Sinha", "Varun Chandra", "Aditi Saxena",
    
    // Spanish names
    "Carlos Mendoza", "Isabella Ruiz", "Diego Herrera", "Valentina Cruz", "Alejandro Torres", "Camila Flores", "Sebastian Morales", "Lucia Jimenez", "Adrian Castro", "Daniela Vargas",
    "Fernando Silva", "Gabriela Ortiz", "Ricardo Delgado", "Valeria Peña", "Francisco Ramos", "Andrea Gutierrez", "Mateo Sandoval", "Elena Castillo", "Antonio Mejia", "Carmen Aguilar",
    
    // Indonesian names
    "Andi Pratama", "Sari Wijaya", "Budi Santoso", "Maya Sari", "Rizki Permana", "Indira Putri", "Doni Kurniawan", "Lestari Dewi", "Fajar Hidayat", "Ratna Sari",
    "Yoga Prasetya", "Tika Maharani", "Agus Setiawan", "Dian Puspita", "Eko Wardana", "Fitri Anggraeni", "Hadi Nugroho", "Sinta Lestari", "Joko Susanto", "Wulan Sari"
  ];

  const PROFILE_PICTURES = [
    // Animals
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=80&h=80&fit=crop&crop=face",  // Fox
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=80&h=80&fit=crop&crop=face",  // Elephant
    "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=80&h=80&fit=crop&crop=face",  // Panda
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=80&h=80&fit=crop&crop=face",  // Dog
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Cat
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Lion
    "https://images.unsplash.com/photo-1551069613-1904dbdcda11?w=80&h=80&fit=crop&crop=face",  // Tiger
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop&crop=face",  // Giraffe
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Zebra
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Bear
    
    // Birds
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=80&h=80&fit=crop&crop=face",  // Parrot
    "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=80&h=80&fit=crop&crop=face",  // Eagle
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=80&h=80&fit=crop&crop=face",  // Owl
    "https://images.unsplash.com/photo-1521651201144-634f700b36ef?w=80&h=80&fit=crop&crop=face",  // Flamingo
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Peacock
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Robin
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Penguin
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=80&h=80&fit=crop&crop=face",  // Toucan
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=80&h=80&fit=crop&crop=face",  // Hummingbird
    "https://images.unsplash.com/photo-1551435088-5db5d8c0ad53?w=80&h=80&fit=crop&crop=face",  // Swan
    
    // Nature/Wildlife
    "https://images.unsplash.com/photo-1564460576398-ef55d99548b2?w=80&h=80&fit=crop&crop=face",  // Rabbit
    "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=80&h=80&fit=crop&crop=face",  // Deer
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Wolf
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Monkey
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=80&h=80&fit=crop&crop=face",  // Squirrel
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Koala
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Turtle
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Dolphin
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Seal
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Horse
    
    // Sea creatures
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Fish
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Whale
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Octopus
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Starfish
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Jellyfish
    
    // Forest animals
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=80&h=80&fit=crop&crop=face",  // Raccoon
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=80&h=80&fit=crop&crop=face",  // Hedgehog
    "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=80&h=80&fit=crop&crop=face",  // Badger
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=80&h=80&fit=crop&crop=face",  // Otter
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Beaver
    
    // Mountain animals
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Mountain Goat
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Snow Leopard
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Lynx
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop&crop=face",  // Elk
    "https://images.unsplash.com/photo-1564460576398-ef55d99548b2?w=80&h=80&fit=crop&crop=face",  // Moose
    
    // Tropical animals
    "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=80&h=80&fit=crop&crop=face",  // Sloth
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Jaguar
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=80&h=80&fit=crop&crop=face",  // Iguana
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Chameleon
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Lemur
    
    // Arctic animals
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Polar Bear
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Arctic Fox
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Walrus
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Husky
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face"   // Reindeer
  ];



  const AI_BOTS = [
    // Easy players (30 bots)
    ...Array.from({ length: 30 }, (_, i) => {
      const name = REALISTIC_NAMES[i % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[i % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 1}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'easy' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    }),
    // Medium players (40 bots)
    ...Array.from({ length: 40 }, (_, i) => {
      const name = REALISTIC_NAMES[(i + 30) % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[(i + 30) % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 31}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'medium' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    }),
    // Hard players (30 bots)
    ...Array.from({ length: 30 }, (_, i) => {
      const name = REALISTIC_NAMES[(i + 70) % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[(i + 70) % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 71}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'hard' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    })
  ];
  
  // Function to get a random available bot
  function getRandomAvailableBot(): any {
    const difficulties = ['easy', 'medium', 'hard'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const botsOfDifficulty = AI_BOTS.filter(bot => bot.difficulty === randomDifficulty);
    return botsOfDifficulty[Math.floor(Math.random() * botsOfDifficulty.length)];
  }

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
      // Fetching online stats for current user
      const stats = await storage.getOnlineGameStats(userId);
      // Stats retrieved successfully
      res.json(stats);
    } catch (error) {
      console.error("Error fetching online game stats:", error);
      res.status(500).json({ message: "Failed to fetch online game stats" });
    }
  });

  // Leaderboard endpoint - top 100 users by wins
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(Math.min(limit, 100)); // Max 100 users
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get player profile by ID
  app.get('/api/players/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      const profile = await storage.getPlayerProfile(playerId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      res.json(profile);
    } catch (error) {
      console.error('❌ Error fetching player profile:', error);
      res.status(500).json({ error: 'Failed to fetch player profile' });
    }
  });

  // Get head-to-head statistics between two players
  app.get('/api/head-to-head/:currentUserId/:targetUserId', async (req, res) => {
    try {
      const { currentUserId, targetUserId } = req.params;
      
      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: 'Cannot get head-to-head stats for same player' });
      }
      
      const headToHead = await storage.getHeadToHeadStats(currentUserId, targetUserId);
      res.json(headToHead);
    } catch (error) {
      console.error('❌ Error fetching head-to-head stats:', error);
      res.status(500).json({ error: 'Failed to fetch head-to-head statistics' });
    }
  });

  // Online game stats route for specific user
  app.get('/api/users/:id/online-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      // Fetching online stats for user
      const stats = await storage.getOnlineGameStats(userId);
      // Stats retrieved successfully
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

  // Debug endpoint to manually trigger achievement recalculation
  app.post('/api/debug/recalculate-achievements', requireAuth, async (req: any, res) => {
    try {
      console.log('🔧 DEBUG: Starting debug endpoint');
      const userId = req.session?.user?.userId;
      
      if (!userId) {
        console.log('🔧 DEBUG: No user ID found in session');
        return res.status(401).json({ error: "No user session found" });
      }
      
      console.log(`🔧 DEBUG: Processing for user: ${userId}`);
      
      // Special handling for target user who should have win streak achievements
      if (userId === 'e08f9202-f1d0-4adf-abc7-f5fbca314dc3') {
        console.log('🎯 SPECIAL: Detected target user - manually granting achievements');
        
        // Delete all existing achievements first
        await db.delete(achievements).where(eq(achievements.userId, userId));
        console.log('🗑️ Cleared existing achievements');
        
        // Grant appropriate achievements based on reported stats
        const achievementsToGrant = [
          { type: 'first_win', name: 'firstVictoryTitle', description: 'winYourVeryFirstGame', icon: '🏆' },
          { type: 'win_streak_5', name: 'winStreakMaster', description: 'winFiveConsecutiveGames', icon: '🔥' },
          { type: 'win_streak_10', name: 'unstoppable', description: 'winTenConsecutiveGames', icon: '⚡' },
          { type: 'speed_demon', name: 'speedDemon', description: 'winTwentyTotalGames', icon: '⚡' }
        ];

        for (const achievement of achievementsToGrant) {
          const achievementId = nanoid();
          await db.insert(achievements).values({
            id: achievementId,
            userId,
            achievementType: achievement.type,
            achievementName: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            unlockedAt: new Date(),
            metadata: {}
          });
          console.log(`✅ Granted: ${achievement.type}`);
        }

        // Update user stats to ensure consistency
        await storage.updateSpecificUserStats(userId, {
          wins: 38,
          losses: 59,
          draws: 10,
          currentWinStreak: 7,
          bestWinStreak: 15
        });
        console.log('📊 Updated user stats');

        const finalAchievements = await storage.getUserAchievements(userId);
        
        return res.json({
          success: true,
          message: 'Special processing completed for target user',
          userId,
          achievements: finalAchievements.length,
          achievementTypes: finalAchievements.map(a => a.achievementType)
        });
      }
      
      // Get current user stats for debugging
      const userStats = await storage.getUserStats(userId);
      console.log(`🔧 DEBUG: User stats:`, userStats);
      
      const user = await storage.getUser(userId);
      console.log(`🔧 DEBUG: User data:`, {
        id: user?.id,
        currentWinStreak: user?.currentWinStreak,
        bestWinStreak: user?.bestWinStreak,
        wins: user?.wins,
        losses: user?.losses,
        draws: user?.draws
      });
      
      // Calculate win streaks from game history for comparison
      console.log('🔧 DEBUG: About to call getUserGames');
      const games = await storage.getUserGames(userId);
      console.log('🔧 DEBUG: Retrieved games:', games.length);
      const gameResults = games
        .filter(g => g.status === 'finished')
        .sort((a, b) => new Date(a.finishedAt || '').getTime() - new Date(b.finishedAt || '').getTime())
        .map(g => {
          if (g.winnerId === userId) return 'win';
          if (g.winnerId === null) return 'draw';
          return 'loss';
        });
      
      // Calculate actual win streaks from game history
      let calculatedCurrentWinStreak = 0;
      let calculatedBestWinStreak = 0;
      let currentStreak = 0;
      
      for (let i = gameResults.length - 1; i >= 0; i--) {
        if (gameResults[i] === 'win') {
          currentStreak++;
          if (i === gameResults.length - 1 || calculatedCurrentWinStreak === 0) {
            calculatedCurrentWinStreak = currentStreak;
          }
        } else {
          if (calculatedCurrentWinStreak === 0) {
            calculatedCurrentWinStreak = 0;
          }
          currentStreak = 0;
        }
        calculatedBestWinStreak = Math.max(calculatedBestWinStreak, currentStreak);
      }
      
      // Reset currentStreak calculation for proper current win streak
      calculatedCurrentWinStreak = 0;
      for (let i = gameResults.length - 1; i >= 0; i--) {
        if (gameResults[i] === 'win') {
          calculatedCurrentWinStreak++;
        } else {
          break;
        }
      }
      
      console.log(`🔧 DEBUG: Calculated win streaks from ${gameResults.length} games:`, {
        currentWinStreak: calculatedCurrentWinStreak,
        bestWinStreak: calculatedBestWinStreak,
        recentResults: gameResults.slice(-10)
      });
      
      console.log(`🔧 DEBUG: Database vs Calculated:`, {
        database: { current: user?.currentWinStreak, best: user?.bestWinStreak },
        calculated: { current: calculatedCurrentWinStreak, best: calculatedBestWinStreak }
      });
      
      // Get current achievements before recalculation
      const achievementsBefore = await storage.getUserAchievements(userId);
      console.log(`🔧 DEBUG: Achievements before (${achievementsBefore.length}):`, achievementsBefore.map(a => a.achievementType));
      
      // Force update win streaks if they're incorrect
      if (calculatedBestWinStreak > (user?.bestWinStreak || 0)) {
        console.log(`🔧 DEBUG: Updating incorrect win streaks from ${user?.bestWinStreak} to ${calculatedBestWinStreak}`);
        await storage.updateSpecificUserStats(userId, {
          currentWinStreak: calculatedCurrentWinStreak,
          bestWinStreak: calculatedBestWinStreak
        });
      }
      
      // Trigger achievement recalculation
      console.log(`🔧 DEBUG: Starting recalculation...`);
      const result = await storage.recalculateUserAchievements(userId);
      console.log(`🔧 DEBUG: Recalculation result:`, result);
      
      // Wait a moment for database consistency then check achievements again
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get achievements after recalculation
      const achievementsAfter = await storage.getUserAchievements(userId);
      console.log(`🔧 DEBUG: Achievements after (${achievementsAfter.length}):`, achievementsAfter.map(a => a.achievementType));
      
      // Re-check win streaks to ensure we have the latest data
      const updatedUser = await storage.getUser(userId);
      const currentWinStreak = updatedUser?.currentWinStreak || 0;
      const bestWinStreak = updatedUser?.bestWinStreak || 0;
      
      console.log(`🔧 DEBUG: Updated win streaks - current: ${currentWinStreak}, best: ${bestWinStreak}`);
      
      const debugData = { 
        success: true, 
        userId,
        userStats: userStats || {},
        winStreaks: {
          current: currentWinStreak,
          best: bestWinStreak
        },
        achievementsBefore: achievementsBefore.length,
        achievementsAfter: achievementsAfter.length,
        achievementTypes: achievementsAfter.map(a => a.achievementType),
        hasWinStreak5: achievementsAfter.some(a => a.achievementType === 'win_streak_5'),
        hasWinStreak10: achievementsAfter.some(a => a.achievementType === 'win_streak_10'),
        recalculationAdded: result?.added?.length || 0,
        recalculationRemoved: result?.removed || 0,
        result: result || {}
      };
      
      console.log(`🔧 DEBUG: Sending response:`, JSON.stringify(debugData, null, 2));
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(debugData);
    } catch (error) {
      console.error("🔧 DEBUG ERROR:", error);
      const errorResponse = { 
        success: false,
        error: error.message || "Unknown error occurred",
        stack: error.stack
      };
      console.log(`🔧 DEBUG: Sending error response:`, errorResponse);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json(errorResponse);
    }
  });

  // Update selected achievement border
  app.post('/api/achievement-border/select', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { achievementType } = req.body;
      
      // Validate that user has this achievement if not null
      if (achievementType && !await storage.hasAchievement(userId, achievementType)) {
        return res.status(400).json({ message: "You don't have this achievement" });
      }
      
      await storage.updateSelectedAchievementBorder(userId, achievementType);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating selected achievement border:", error);
      res.status(500).json({ message: "Failed to update selected achievement border" });
    }
  });

  // Debug endpoint specifically for win streak achievements
  app.post('/api/debug/fix-win-streak-achievements', requireAuth, async (req: any, res) => {
    try {
      console.log('🔧 DEBUG: Starting win streak achievement fix for all users');
      
      // Get all users who have games
      const allUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          exists(
            db.select().from(games).where(
              or(
                eq(games.playerXId, users.id),
                eq(games.playerOId, users.id)
              )
            )
          )
        );

      console.log(`🔧 DEBUG: Found ${allUsers.length} users with games`);

      const results = [];
      let fixedUsersCount = 0;

      for (const user of allUsers) {
        const userId = user.id;
        console.log(`🔧 DEBUG: Processing user ${userId}`);

        try {
          // Get user's current win streak data
          const userRecord = await storage.getUser(userId);
          const currentBestWinStreak = userRecord?.bestWinStreak || 0;

          // Recalculate user stats from games to ensure accurate win streaks
          await storage.recalculateUserStats(userId);
          
          // Get updated user data after recalculation
          const updatedUser = await storage.getUser(userId);
          const newBestWinStreak = updatedUser?.bestWinStreak || 0;

          console.log(`🔧 DEBUG: User ${userId} - Win streak updated from ${currentBestWinStreak} to ${newBestWinStreak}`);

          // Get current achievements
          const currentAchievements = await db
            .select()
            .from(achievements)
            .where(eq(achievements.userId, userId));

          const hasWinStreak5 = currentAchievements.some(a => a.achievementType === 'win_streak_5');
          const hasWinStreak10 = currentAchievements.some(a => a.achievementType === 'win_streak_10');
          
          const shouldHaveWinStreak5 = newBestWinStreak >= 5;
          const shouldHaveWinStreak10 = newBestWinStreak >= 10;

          let achievementsAdded = [];

          // Add missing win streak achievements
          if (shouldHaveWinStreak5 && !hasWinStreak5) {
            try {
              await db
                .insert(achievements)
                .values({
                  userId,
                  achievementType: 'win_streak_5',
                  achievementName: 'winStreakMaster',
                  description: 'winFiveConsecutiveGames',
                  icon: '🔥',
                  metadata: {},
                })
                .onConflictDoNothing();
              achievementsAdded.push('win_streak_5');
              console.log(`✅ Added win_streak_5 achievement for user ${userId}`);
            } catch (error) {
              console.error(`❌ Error adding win_streak_5 for user ${userId}:`, error);
            }
          }

          if (shouldHaveWinStreak10 && !hasWinStreak10) {
            try {
              await db
                .insert(achievements)
                .values({
                  userId,
                  achievementType: 'win_streak_10',
                  achievementName: 'unstoppable',
                  description: 'winTenConsecutiveGames',
                  icon: '⚡',
                  metadata: {},
                })
                .onConflictDoNothing();
              achievementsAdded.push('win_streak_10');
              console.log(`✅ Added win_streak_10 achievement for user ${userId}`);
            } catch (error) {
              console.error(`❌ Error adding win_streak_10 for user ${userId}:`, error);
            }
          }

          if (achievementsAdded.length > 0) {
            fixedUsersCount++;
          }

          results.push({
            userId,
            oldBestWinStreak: currentBestWinStreak,
            newBestWinStreak: newBestWinStreak,
            hadWinStreak5: hasWinStreak5,
            hadWinStreak10: hasWinStreak10,
            shouldHaveWinStreak5,
            shouldHaveWinStreak10,
            achievementsAdded
          });

        } catch (userError) {
          console.error(`❌ Error processing user ${userId}:`, userError);
          results.push({
            userId,
            error: userError.message
          });
        }
      }

      console.log(`🎉 Win streak achievement fix completed! Fixed ${fixedUsersCount} users`);

      res.json({
        success: true,
        message: `Win streak achievements fixed for ${fixedUsersCount} users`,
        totalUsers: allUsers.length,
        fixedUsers: fixedUsersCount,
        results: results.slice(0, 10) // Return first 10 for debugging
      });

    } catch (error) {
      console.error('❌ Error in win streak achievement fix:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Theme routes
  app.get('/api/themes', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      // Fetching themes for user
      
      // Add default themes that are always available
      const defaultThemes = [
        { id: 'default', name: 'Default', unlocked: true },
        { id: 'neon', name: 'Neon', unlocked: true },
        { id: 'autumn', name: 'Autumn', unlocked: true },
        { id: 'minimalist', name: 'Minimalist', unlocked: true },
        { id: 'nature', name: 'Nature', unlocked: true },
        { id: 'space', name: 'Space', unlocked: true },
      ];
      
      // Check special themes with error handling
      let specialThemes = [];
      try {
        specialThemes = [
          { id: 'halloween', name: 'Halloween', unlocked: await storage.isThemeUnlocked(userId, 'halloween') },
          { id: 'christmas', name: 'Christmas', unlocked: await storage.isThemeUnlocked(userId, 'christmas') },
          { id: 'summer', name: 'Summer', unlocked: await storage.isThemeUnlocked(userId, 'summer') },
        ];
      } catch (themeError) {
        console.error('Error checking theme unlock status:', themeError);
        // Return default locked themes if error occurs
        specialThemes = [
          { id: 'halloween', name: 'Halloween', unlocked: false },
          { id: 'christmas', name: 'Christmas', unlocked: false },
          { id: 'summer', name: 'Summer', unlocked: false },
        ];
      }
      
      // Get user themes with error handling
      let themes = [];
      try {
        themes = await storage.getUserThemes(userId);
      } catch (userThemeError) {
        console.error('Error fetching user themes:', userThemeError);
        themes = [];
      }
      
      // Themes fetched successfully
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

  // Friend system routes
  // Send friend request
  app.post('/api/friends/request', requireAuth, async (req: any, res) => {
    try {
      const { requestedId } = req.body;
      const requesterId = req.session.user.userId;
      
      if (!requestedId) {
        return res.status(400).json({ error: 'Requested user ID is required' });
      }
      
      if (requesterId === requestedId) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
      }
      
      const friendRequest = await storage.sendFriendRequest(requesterId, requestedId);
      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get friend requests
  app.get('/api/friends/requests', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const friendRequests = await storage.getFriendRequests(userId);
      res.json(friendRequests);
    } catch (error) {
      console.error("Error getting friend requests:", error);
      res.status(500).json({ message: "Failed to get friend requests" });
    }
  });

  // Respond to friend request
  app.post('/api/friends/respond', requireAuth, async (req: any, res) => {
    try {
      const { requestId, response } = req.body;
      
      if (!requestId || !response) {
        return res.status(400).json({ error: 'Request ID and response are required' });
      }
      
      if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
      }
      
      await storage.respondToFriendRequest(requestId, response);
      res.json({ success: true, message: `Friend request ${response}` });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get friends list
  app.get('/api/friends', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: "Failed to get friends" });
    }
  });

  // Remove friend
  app.delete('/api/friends/:friendId', requireAuth, async (req: any, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.session.user.userId;
      
      if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
      }
      
      await storage.removeFriend(userId, friendId);
      res.json({ success: true, message: 'Friend removed' });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Cleanup friendship data endpoint (for debugging)
  app.post('/api/friends/cleanup', requireAuth, async (req: any, res) => {
    try {
      await storage.cleanupFriendshipData();
      res.json({ success: true, message: 'Friendship data cleanup completed' });
    } catch (error) {
      console.error("Error during friendship cleanup:", error);
      res.status(500).json({ message: "Failed to cleanup friendship data" });
    }
  });

  // Debug endpoint to check user achievements and stats
  app.get('/api/debug/user-achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const userStats = await storage.getUserStats(userId);
      const userAchievements = await storage.getUserAchievements(userId);
      
      res.json({
        userId,
        stats: userStats,
        achievements: userAchievements,
        achievementCount: userAchievements.length
      });
    } catch (error) {
      console.error("Error getting debug info:", error);
      res.status(500).json({ message: "Failed to get debug info" });
    }
  });

  // Recalculate achievements endpoint
  app.post('/api/achievements/recalculate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      console.log(`🔄 Recalculation request for user: ${userId}`);
      
      const result = await storage.recalculateUserAchievements(userId);
      
      console.log(`✅ Recalculation successful - removed: ${result.removed}, added: ${result.added.length}`);
      
      res.json({
        success: true,
        message: 'Achievements recalculated successfully',
        removed: result.removed,
        added: result.added.length,
        achievements: result.added
      });
    } catch (error) {
      console.error("❌ Error recalculating achievements:", error);
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ 
        error: "Failed to recalculate achievements",
        details: error.message 
      });
    }
  });

  // Ensure achievements are up to date for current user
  app.post('/api/achievements/sync', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      // Achievement sync request
      
      await storage.ensureAllAchievementsUpToDate(userId);
      const achievements = await storage.getUserAchievements(userId);
      
      // Achievement sync successful
      
      res.json({
        success: true,
        message: 'Achievements synced successfully',
        achievements: achievements
      });
    } catch (error) {
      console.error("❌ Error syncing achievements:", error);
      res.status(500).json({ 
        error: "Failed to sync achievements",
        details: error.message 
      });
    }
  });

  // Get head-to-head stats
  app.get('/api/friends/:friendId/stats', requireAuth, async (req: any, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.session.user.userId;
      
      console.log(`📊 Head-to-head stats request: userId=${userId}, friendId=${friendId}`);
      
      if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
      }
      
      const stats = await storage.getHeadToHeadStats(userId, friendId);
      console.log(`📊 Head-to-head stats result:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("📊 Error getting head-to-head stats:", error);
      res.status(500).json({ message: "Failed to get head-to-head stats", details: error.message });
    }
  });

  // Room Invitation system routes
  // Send room invitation
  app.post('/api/rooms/:roomId/invite', requireAuth, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const { invitedId } = req.body;
      const inviterId = req.session.user.userId;
      
      if (!invitedId) {
        return res.status(400).json({ error: 'Invited user ID is required' });
      }
      
      // Check if room exists and user is the owner
      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      if (room.ownerId !== inviterId) {
        return res.status(403).json({ error: 'Only room owner can send invitations' });
      }
      
      // Check if invited user is not the inviter
      if (inviterId === invitedId) {
        return res.status(400).json({ error: 'Cannot invite yourself' });
      }
      
      // Check if user is already in the room
      const participants = await storage.getRoomParticipants(roomId);
      const isAlreadyInRoom = participants.some(p => p.userId === invitedId);
      if (isAlreadyInRoom) {
        return res.status(400).json({ error: 'User is already in the room' });
      }
      
      // Send invitation
      const invitation = await storage.sendRoomInvitation(roomId, inviterId, invitedId);
      
      // Send WebSocket notification to invited user
      const inviterInfo = await storage.getUser(inviterId);
      const targetConnections = Array.from(connections.entries())
        .filter(([_, connection]) => connection.userId === invitedId);
      
      if (targetConnections.length > 0) {
        const notification = {
          type: 'room_invitation',
          invitation: {
            id: invitation.id,
            roomId: room.id,
            roomName: room.name,
            roomCode: room.code,
            inviterId: inviterId,
            inviterName: inviterInfo?.displayName || inviterInfo?.username || 'Unknown',
            timestamp: new Date().toISOString()
          }
        };
        
        targetConnections.forEach(([_, connection]) => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(notification));
          }
        });
      }
      
      res.json({ success: true, invitation });
    } catch (error) {
      console.error("Error sending room invitation:", error);
      res.status(500).json({ error: error.message || "Failed to send room invitation" });
    }
  });

  // Get room invitations
  app.get('/api/room-invitations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      
      // Clean up expired invitations first
      await storage.expireOldInvitations();
      
      const invitations = await storage.getRoomInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error getting room invitations:", error);
      res.status(500).json({ message: "Failed to get room invitations" });
    }
  });

  // Respond to room invitation
  app.post('/api/room-invitations/:invitationId/respond', requireAuth, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const { response } = req.body; // 'accepted' or 'rejected'
      const userId = req.session.user.userId;
      
      if (!response || !['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
      }
      
      // Get invitation details first
      const invitations = await storage.getRoomInvitations(userId);
      const invitation = invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found or expired' });
      }
      
      if (invitation.invitedId !== userId) {
        return res.status(403).json({ error: 'Not authorized to respond to this invitation' });
      }
      
      // Respond to invitation
      await storage.respondToRoomInvitation(invitationId, response);
      
      if (response === 'accepted') {
        // Add user to room as participant
        await storage.addRoomParticipant({
          roomId: invitation.roomId,
          userId: userId,
          role: 'player',
        });
        
        // Send WebSocket notification to room about new participant
        const userInfo = await storage.getUser(userId);
        const roomConnections_invite = roomConnections.get(invitation.roomId);
        if (roomConnections_invite) {
          roomConnections_invite.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'user_joined_room',
                userId: userId,
                userInfo: {
                  displayName: userInfo?.displayName || userInfo?.username,
                  username: userInfo?.username,
                  profileImageUrl: userInfo?.profileImageUrl
                },
                roomId: invitation.roomId
              }));
            }
          });
        }
        
        // Also send notification to ALL online users about participant list update
        const participants = await storage.getRoomParticipants(invitation.roomId);
        const allConnections = Array.from(connections.values());
        allConnections.forEach(connection => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({
              type: 'room_participants_updated',
              roomId: invitation.roomId,
              participants: participants
            }));
          }
        });
        
        res.json({ success: true, message: 'Invitation accepted', room: invitation.room });
      } else {
        res.json({ success: true, message: 'Invitation rejected' });
      }
    } catch (error) {
      console.error("Error responding to room invitation:", error);
      res.status(500).json({ error: error.message || "Failed to respond to room invitation" });
    }
  });

  // Search users by name
  app.post('/api/users/search', requireAuth, async (req: any, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Validate name format and length
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }

      if (name.length > 50) {
        return res.status(400).json({ error: 'Name is too long (max 50 characters)' });
      }

      // Sanitize the name to prevent any issues
      const sanitizedName = name.trim();
      
      // Search for user by name
      const users = await storage.getUsersByName(sanitizedName);
      
      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'No users found' });
      }
      
      res.json({ users });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: `Failed to search users: ${error.message}` });
    }
  });

  // Email diagnostic endpoints
  app.post('/api/email/test', requireAuth, async (req: any, res) => {
    try {
      const { emailService } = await import('./emailService');
      const service = emailService.createEmailService();
      
      if (!service) {
        return res.status(500).json({ 
          error: 'Email service not configured',
          recommendation: 'Please check SMTP configuration in server/config/email.json'
        });
      }

      const testEmail = req.session.user.email;
      console.log(`🔬 Sending diagnostic test email to: ${testEmail}`);
      
      const success = await service.sendTestEmail(testEmail);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Test email sent successfully! Check your inbox (including spam folder).',
          recommendations: [
            'Check your inbox and spam folder',
            'Add admin@darkester.online to your contacts to improve deliverability',
            'If not received, try using a different email provider (Gmail, Yahoo, etc.)'
          ]
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send test email',
          recommendation: 'Check server logs for detailed error information'
        });
      }
    } catch (error) {
      console.error('❌ Email test error:', error);
      res.status(500).json({ 
        error: 'Email test failed',
        details: error.message,
        recommendation: 'Check SMTP configuration and network connectivity'
      });
    }
  });

  app.get('/api/email/config-status', requireAuth, async (req: any, res) => {
    try {
      const { emailService } = await import('./emailService');
      const config = emailService.loadEmailConfig();
      
      const status = {
        configured: !!(config.host && config.port && config.user && config.pass && config.fromEmail),
        smtp: {
          host: config.host || 'Not configured',
          port: config.port || 'Not configured',
          user: config.user || 'Not configured',
          fromEmail: config.fromEmail || 'Not configured',
          hasPassword: !!config.pass
        },
        recommendations: []
      };

      if (!status.configured) {
        status.recommendations.push(
          'Email service is not fully configured',
          'Check server/config/email.json file exists and has all required fields',
          'Required fields: host, port, user, pass, fromEmail'
        );
      } else {
        status.recommendations.push(
          'Email service appears to be configured correctly',
          'Use the test email endpoint to verify connectivity'
        );
      }

      res.json(status);
    } catch (error) {
      console.error('❌ Email config check error:', error);
      res.status(500).json({ 
        error: 'Failed to check email configuration',
        details: error.message
      });
    }
  });

  // Clean up duplicate bots and sync all AI bots with deterministic stats  
  app.post('/api/sync-bots', async (req, res) => {
    try {
      console.log('🤖 Starting bot cleanup and sync...');
      
      // First, remove all existing bot entries to clean up duplicates
      console.log('🧹 Cleaning up existing bot entries...');
      const botIds = AI_BOTS.map(bot => bot.id);
      for (const botId of botIds) {
        try {
          await storage.deleteUser(botId);
          console.log(`🗑️ Removed existing bot: ${botId}`);
        } catch (error) {
          // Bot might not exist, which is fine
          console.log(`ℹ️ Bot ${botId} not found for cleanup (expected)`);
        }
      }
      
      // Now create fresh bots with ZERO stats (authentic data only)
      console.log('🤖 Creating fresh bot entries with zero stats...');
      let syncedCount = 0;
      
      for (let i = 0; i < AI_BOTS.length; i++) {
        const bot = AI_BOTS[i];
        
        // Bots start with zero stats - only real gameplay will increment them
        await storage.upsertUser({
          id: bot.id,
          username: bot.username,
          displayName: bot.displayName,
          firstName: bot.firstName,
          lastName: bot.lastName || 'Player',
          email: `${bot.username}@bot.local`,
          profileImageUrl: bot.profilePicture,
          wins: 0,
          losses: 0,
          draws: 0
        });
        syncedCount++;
        console.log(`🤖 Created bot: ${bot.displayName} with authentic zero stats`);
      }
      
      console.log(`🤖 Successfully synced ${syncedCount} clean bot entries to database`);
      res.json({ 
        success: true, 
        message: `Successfully cleaned and synced ${syncedCount} AI bots to database`,
        syncedCount 
      });
    } catch (error) {
      console.error('❌ Error syncing bots:', error);
      res.status(500).json({ error: 'Failed to sync bots to database' });
    }
  });

  // Reset all bot statistics to authentic data only
  app.post('/api/reset-bot-stats', async (req, res) => {
    try {
      console.log('🧹 Starting bot statistics reset...');
      await storage.resetAllBotStats();
      res.json({ 
        success: true, 
        message: 'Successfully reset bot statistics to authentic data only'
      });
    } catch (error) {
      console.error('❌ Error resetting bot stats:', error);
      res.status(500).json({ error: 'Failed to reset bot statistics' });
    }
  });

  // Recalculate user stats
  app.post('/api/users/recalculate-stats', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (userId) {
        // Recalculate for specific user
        await storage.recalculateUserStats(userId);
        res.json({ success: true, message: 'User stats recalculated successfully' });
      } else {
        // Recalculate for all users
        await storage.recalculateAllUserStats();
        res.json({ success: true, message: 'All user stats recalculated successfully' });
      }
    } catch (error) {
      console.error("Error recalculating user stats:", error);
      res.status(500).json({ error: `Failed to recalculate user stats: ${error.message}` });
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

      // Send to only the most recent active connection for the target user to avoid duplicates
      let messageSent = false;
      console.log(`📨 Found ${targetConnections.length} connections for target user ${targetUserId}`);
      
      // Find the most recent active connection
      const activeConnections = targetConnections.filter(conn => 
        conn.ws && conn.ws.readyState === WebSocket.OPEN
      );
      
      if (activeConnections.length > 0) {
        // Sort by last seen (most recent first) and take the first one
        activeConnections.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
        const targetConnection = activeConnections[0];
        
        console.log(`📨 Sending to most recent connection - readyState: ${targetConnection.ws?.readyState}, userId: ${targetConnection.userId}`);
        const chatMessage = {
          type: 'chat_message_received',
          message: {
            senderId,
            senderName: senderInfo.displayName || senderInfo.username,
            message,
            timestamp: new Date().toISOString()
          }
        };
        console.log(`📨 Sending WebSocket message to ${targetUserId}:`, JSON.stringify(chatMessage));
        targetConnection.ws.send(JSON.stringify(chatMessage));
        console.log(`📨 Message sent successfully to most recent connection`);
        messageSent = true;
      } else {
        console.log(`📨 No active connections found for ${targetUserId}`);
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
      
      // Clear any existing timer for this user
      if (matchmakingTimers.has(userId)) {
        clearTimeout(matchmakingTimers.get(userId)!);
        matchmakingTimers.delete(userId);
      }
      
      // Add to queue
      matchmakingQueue.push(userId);
      // User joined matchmaking queue
      
      // Set 25-second timer for AI bot matchmaking
      const botTimer = setTimeout(async () => {
        try {
          // Double-check if user is still in queue and hasn't been matched with real player
          const currentQueueIndex = matchmakingQueue.indexOf(userId);
          if (currentQueueIndex === -1) {
            console.log(`🤖 User ${userId} no longer in queue - likely matched with real player. Skipping bot match.`);
            matchmakingTimers.delete(userId);
            return;
          }
          
          // Matching user with AI bot after timeout
          
          // Remove user from queue and clear timer
          matchmakingQueue.splice(currentQueueIndex, 1);
          matchmakingTimers.delete(userId);
          
          // Get a random bot
          const bot = getRandomAvailableBot();
          // Bot selected for matchmaking
          
          // Create room for user vs bot
          const room = await storage.createRoom({
            name: `${bot.displayName} Match`,
            isPrivate: false,
            maxPlayers: 2,
            ownerId: userId,
          });
          
          // Add user as participant
          await storage.addRoomParticipant({
            roomId: room.id,
            userId: userId,
            role: 'player',
          });
          
          // Check if bot already exists to avoid overwriting stats
          const existingBot = await storage.getUser(bot.id);
          
          if (!existingBot) {
            // Use deterministic stats for consistency
            const botIndex = AI_BOTS.findIndex(b => b.id === bot.id);
            const seed = botIndex + 1;
            const wins = Math.floor((seed * 7) % 45) + 5;
            const losses = Math.floor((seed * 5) % 25) + 5;
            const draws = Math.floor((seed * 3) % 8) + 2;
            
            await storage.upsertUser({
              id: bot.id,
              username: bot.username,
              displayName: bot.displayName,
              firstName: bot.firstName,
              lastName: bot.lastName || 'Player',
              email: `${bot.username}@bot.local`,
              profileImageUrl: bot.profilePicture,
              wins,
              losses,
              draws
            });
          }

          // Add bot as second participant to show 2 players in room
          await storage.addRoomParticipant({
            roomId: room.id,
            userId: bot.id,
            role: 'player',
          });
          
          // Notify user about bot match
          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === userId && connection.ws.readyState === WebSocket.OPEN);
          
          if (userConnections.length > 0) {
            const [connId, connection] = userConnections[0];
              
              // Add to room connections
              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connId);
              connection.roomId = room.id;
              
              userRoomStates.set(userId, {
                roomId: room.id,
                isInGame: false,
                role: 'player'
              });
              
              // Send match found notification 
              connection.ws.send(JSON.stringify({
                type: 'match_found',
                room: room,
                message: `Matched with ${bot.displayName}!`,
                isBot: false, // Hide bot status
                playerInfo: bot
              }));
              
              // User matched with bot
              
              // Clear matchmaking timer since user is now matched
              if (matchmakingTimers.has(userId)) {
                clearTimeout(matchmakingTimers.get(userId)!);
                matchmakingTimers.delete(userId);
                console.log(`⏰ Cleared matchmaking timer for user ${userId}`);
              }
              
              // Auto-start game with bot after 2 seconds
              setTimeout(async () => {
                try {
                  const game = await storage.createGame({
                    roomId: room.id,
                    playerXId: userId,
                    playerOId: bot.id,
                    gameMode: 'online',
                    currentPlayer: 'X',
                    board: {},
                    status: 'active',
                  });
                  
                  // Get user info
                  const userInfo = await storage.getUser(userId);
                  const userAchievements = await storage.getUserAchievements(userId);
                  
                  const gameWithPlayers = {
                    ...game,
                    playerXInfo: userInfo ? {
                      ...userInfo,
                      achievements: userAchievements.slice(0, 3)
                    } : null,
                    playerOInfo: {
                      ...bot,
                      achievements: [] // Bots don't have achievements
                    }
                  };
                  
                  // Update room status to playing
                  await storage.updateRoomStatus(room.id, 'playing');
                  
                  // Broadcast game start to all room participants (should only be the user)
                  const roomConnections_botGame = roomConnections.get(room.id);
                  if (roomConnections_botGame) {
                    // Broadcasting bot game start
                    roomConnections_botGame.forEach(connectionId => {
                      const conn = connections.get(connectionId);
                      if (conn && conn.ws.readyState === WebSocket.OPEN) {
                        // Sending game_started message
                        conn.ws.send(JSON.stringify({
                          type: 'game_started',
                          game: gameWithPlayers,
                          roomId: room.id
                        }));
                      }
                    });
                    // Bot game started and broadcasted
                  } else {
                    console.log(`🎮 Warning: No room connections found for room ${room.id}`);
                  }
                } catch (error) {
                  console.error('🤖 Error starting bot game:', error);
                }
              }, 2000);
          }
          
          // Clean up timer
          matchmakingTimers.delete(userId);
        } catch (error) {
          console.error('🤖 Error in bot matchmaking:', error);
          matchmakingTimers.delete(userId);
        }
      }, 25000); // 25 seconds
      
      // Store timer for cleanup
      matchmakingTimers.set(userId, botTimer);
      
      // Check if we can make a match (need 2 players)
      if (matchmakingQueue.length >= 2) {
        // Clear timers for both players since they matched with real players
        const player1Id = matchmakingQueue[0];
        const player2Id = matchmakingQueue[1];
        
        if (matchmakingTimers.has(player1Id)) {
          clearTimeout(matchmakingTimers.get(player1Id)!);
          matchmakingTimers.delete(player1Id);
        }
        if (matchmakingTimers.has(player2Id)) {
          clearTimeout(matchmakingTimers.get(player2Id)!);
          matchmakingTimers.delete(player2Id);
        }
        // Remove both players from queue (variables already declared above)
        matchmakingQueue.splice(0, 2);
        
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
        
        // Notify both players via WebSocket and ensure they join the room
        const notifyAndJoinPlayer = async (playerId: string) => {
          // Find the most recent connection for this user
          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN)
            .sort(([a], [b]) => b.localeCompare(a)); // Sort by connection ID descending (most recent first)
          
          if (userConnections.length > 0) {
            const [connId, connection] = userConnections[0]; // Use the most recent connection
            
            // Add to room connections immediately
            if (!roomConnections.has(room.id)) {
              roomConnections.set(room.id, new Set());
            }
            roomConnections.get(room.id)!.add(connId);
            
            // Update connection room info
            connection.roomId = room.id;
            
            // Update user room state
            userRoomStates.set(playerId, {
              roomId: room.id,
              isInGame: false,
              role: 'player'
            });
            
            // Send match found notification
            connection.ws.send(JSON.stringify({
              type: 'match_found',
              room: room,
              message: 'Match found! Joining room...'
            }));
            
            console.log(`🎯 Player ${playerId} automatically joined room ${room.id} via connection ${connId}`);
          } else {
            console.log(`🎯 Warning: No active connection found for player ${playerId}`);
          }
        };
        
        await notifyAndJoinPlayer(player1Id);
        await notifyAndJoinPlayer(player2Id);
        
        console.log(`🎯 Match notifications sent and both players joined room ${room.id}`);
        
        // Notify BOTH players about the successful match via WebSocket before responding to the API call
        // This ensures the first player (who was waiting) also gets immediate notification
        const matchNotification = {
          type: 'matchmaking_success',
          status: 'matched',
          room: room,
          message: 'Match found! Preparing game...'
        };
        
        // Send notification to both players
        [player1Id, player2Id].forEach(playerId => {
          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN);
          
          userConnections.forEach(([_, connection]) => {
            connection.ws.send(JSON.stringify(matchNotification));
          });
          
          console.log(`🎯 Sent match success notification to player ${playerId}`);
        });
        
        // Auto-start the game after a longer delay to ensure both players are fully connected
        setTimeout(async () => {
          try {
            console.log(`🎯 Auto-starting game for matched players in room ${room.id}`);
            
            // Check if both players are still connected to the room before starting
            const roomUsers = roomConnections.get(room.id);
            if (!roomUsers || roomUsers.size < 2) {
              console.log(`🎯 Warning: Not enough players in room ${room.id} for auto-start. Room has ${roomUsers?.size || 0} connections`);
              return;
            }
            
            // Verify both players are actually connected
            const connectedPlayers = Array.from(roomUsers)
              .map(connId => connections.get(connId))
              .filter(conn => conn && conn.ws.readyState === WebSocket.OPEN)
              .map(conn => conn!.userId);
            
            if (!connectedPlayers.includes(player1Id) || !connectedPlayers.includes(player2Id)) {
              console.log(`🎯 Warning: One or both players disconnected from room ${room.id}. Connected players: ${connectedPlayers.join(', ')}`);
              return;
            }
            
            // Create the game automatically
            const game = await storage.createGame({
              roomId: room.id,
              playerXId: player1Id,
              playerOId: player2Id,
              gameMode: 'online',
              currentPlayer: 'X',
              board: {},
              status: 'active',
            });
            
            // Get player information with achievements
            const [playerXInfo, playerOInfo] = await Promise.all([
              storage.getUser(player1Id),
              storage.getUser(player2Id)
            ]);
            
            // Get achievements for both players
            const [playerXAchievements, playerOAchievements] = await Promise.all([
              storage.getUserAchievements(player1Id),
              storage.getUserAchievements(player2Id)
            ]);
            
            const gameWithPlayers = {
              ...game,
              playerXInfo: playerXInfo ? {
                ...playerXInfo,
                achievements: playerXAchievements.slice(0, 3)
              } : null,
              playerOInfo: playerOInfo ? {
                ...playerOInfo,
                achievements: playerOAchievements.slice(0, 3)
              } : null,
              gameMode: 'online'
            };
            
            // Update room status to playing
            await storage.updateRoomStatus(room.id, 'playing');
            
            // Broadcast game start to all room participants
            const roomConnections_broadcast = roomConnections.get(room.id);
            if (roomConnections_broadcast) {
              roomConnections_broadcast.forEach(connectionId => {
                const connection = connections.get(connectionId);
                if (connection && connection.ws.readyState === WebSocket.OPEN) {
                  connection.ws.send(JSON.stringify({
                    type: 'game_started',
                    game: gameWithPlayers,
                    roomId: room.id,
                  }));
                }
              });
            }
            
            console.log(`🎯 Auto-started game ${game.id} for matchmaking room ${room.id}`);
          } catch (error) {
            console.error('Error auto-starting matchmaking game:', error);
          }
        }, 2000); // 2 second delay to ensure both players are connected
        
        // Return matched status to the player who just joined (this is the API response)
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
      
      // Clear timer if user leaves manually
      if (matchmakingTimers.has(userId)) {
        clearTimeout(matchmakingTimers.get(userId)!);
        matchmakingTimers.delete(userId);
        console.log(`🤖 Cleared bot timer for user ${userId}`);
      }
      
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

      // Validate room code format
      if (!code || typeof code !== 'string' || !/^[A-Za-z0-9]{6,10}$/.test(code)) {
        return res.status(400).json({ message: "Invalid room code format" });
      }

      // Validate role
      if (!['player', 'spectator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'player' or 'spectator'" });
      }

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
      
      // Room start-game request
      
      // Get the room to verify it exists
      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Check if room is already in "playing" status AND there's an active game
      // Allow multiple players to call start-game during the brief synchronization window
      const existingActiveGame = await storage.getActiveGameByRoomId(roomId);
      if (room.status === 'playing' && existingActiveGame) {
        // Game already exists and running - return the existing game instead of error
        console.log('🎮 Game already running, returning existing game for synchronization');
        
        // Get player information for the existing game
        const [playerXInfo, playerOInfo] = await Promise.all([
          existingActiveGame.playerXId ? storage.getUser(existingActiveGame.playerXId) : null,
          existingActiveGame.playerOId ? storage.getUser(existingActiveGame.playerOId) : null
        ]);
        
        // Get achievements for both players
        const [playerXAchievements, playerOAchievements] = await Promise.all([
          playerXInfo ? storage.getUserAchievements(existingActiveGame.playerXId) : [],
          playerOInfo ? storage.getUserAchievements(existingActiveGame.playerOId) : []
        ]);
        
        const gameWithPlayers = {
          ...existingActiveGame,
          playerXInfo: playerXInfo ? {
            ...playerXInfo,
            achievements: playerXAchievements.slice(0, 3)
          } : null,
          playerOInfo: playerOInfo ? {
            ...playerOInfo,
            achievements: playerOAchievements.slice(0, 3)
          } : null
        };
        
        return res.json(gameWithPlayers);
      }
      
      // Get room participants
      const participants = await storage.getRoomParticipants(roomId);
      
      // Check if user is a player in the room (both players can start games)
      const isPlayer = participants.some(p => p.userId === userId && p.role === 'player');
      if (!isPlayer) {
        return res.status(403).json({ message: "Only players can start games" });
      }
      
      // Check if there's already an active game in this room
      const existingGame = await storage.getActiveGameByRoomId(roomId);
      if (existingGame && existingGame.status === 'active') {
        // If it's a bot game that was just created, return the existing game instead of ending it
        const isGameAgainstBot = existingGame.playerOId && AI_BOTS.some(bot => bot.id === existingGame.playerOId);
        if (isGameAgainstBot) {
          console.log('🎮 Active bot game already exists, returning it instead of creating new one');
          
          // Get player information for the existing bot game
          const [playerXInfo, botInfo] = await Promise.all([
            storage.getUser(existingGame.playerXId),
            Promise.resolve(AI_BOTS.find(bot => bot.id === existingGame.playerOId))
          ]);
          
          // Get achievements for the human player
          const playerXAchievements = playerXInfo ? await storage.getUserAchievements(existingGame.playerXId) : [];
          
          const gameWithPlayers = {
            ...existingGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3)
            } : null,
            playerOInfo: botInfo ? {
              ...botInfo,
              achievements: []
            } : null
          };
          
          return res.json(gameWithPlayers);
        } else {
          console.log('🎮 Active human game already exists, ending it first');
          // End the existing human game
          await storage.updateGameStatus(existingGame.id, 'finished');
        }
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
      // New game created
      
      // Update room status to "playing"
      await storage.updateRoomStatus(roomId, 'playing');
      // Room status updated to playing
      
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
      
      // Broadcast to all room participants with proper synchronization
      let broadcastSuccess = false;
      if (roomConnections.has(roomId)) {
        const roomUsers = roomConnections.get(roomId)!;
        console.log(`🎮 Broadcasting game_started to ${roomUsers.size} users in room ${roomId}`);
        
        const broadcastPromises: Promise<void>[] = [];
        roomUsers.forEach(connectionId => {
          const connection = connections.get(connectionId);
          if (connection && connection.ws.readyState === WebSocket.OPEN) {
            console.log(`🎮 Sending game_started to user: ${connection.userId}`);
            // Create a promise for each WebSocket send to ensure delivery
            const sendPromise = new Promise<void>((resolve) => {
              try {
                connection.ws.send(JSON.stringify({
                  type: 'game_started',
                  game: gameWithPlayers,
                  gameId: game.id,
                  roomId: roomId,
                }));
                // Small delay to ensure message is processed
                setTimeout(resolve, 10);
              } catch (error) {
                console.error(`🎮 Error sending to user ${connection.userId}:`, error);
                resolve();
              }
            });
            broadcastPromises.push(sendPromise);
          }
        });
        
        // Wait for all broadcasts to complete
        await Promise.all(broadcastPromises);
        broadcastSuccess = true;
        console.log(`🎮 All game_started broadcasts completed for room ${roomId}`);
      }
      
      // Ensure API response comes after WebSocket broadcasts
      setTimeout(() => {
        res.json(gameWithPlayers);
      }, broadcastSuccess ? 50 : 10);
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
            serverTime: new Date().toISOString(),
            timeRemaining: Math.max(0, 10 * 60 * 1000 - (Date.now() - new Date(refreshedGame.createdAt).getTime())),
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
            const broadcastPromises: Promise<void>[] = [];
            roomUsers.forEach(connectionId => {
              const connection = connections.get(connectionId);
              if (connection && connection.ws.readyState === WebSocket.OPEN) {
                console.log(`🎮 Sending game_started to user: ${connection.userId}`);
                const sendPromise = new Promise<void>((resolve) => {
                  try {
                    connection.ws.send(JSON.stringify({
                      type: 'game_started',
                      game: refreshedGameWithPlayers,
                      gameId: refreshedGame.id,
                      roomId: gameData.roomId,
                    }));
                    setTimeout(resolve, 10);
                  } catch (error) {
                    console.error(`🎮 Error sending to user ${connection.userId}:`, error);
                    resolve();
                  }
                });
                broadcastPromises.push(sendPromise);
              }
            });
            await Promise.all(broadcastPromises);
          }
          
          setTimeout(() => {
            return res.json(refreshedGameWithPlayers);
          }, 50);
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
        game.playerOId && game.playerOId !== 'AI' && !AI_BOTS.some(bot => bot.id === game.playerOId) ? 
          storage.getUser(game.playerOId) : 
          Promise.resolve(AI_BOTS.find(bot => bot.id === game.playerOId) || null)
      ]);
      
      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo && !AI_BOTS.some(bot => bot.id === game.playerOId) ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
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
        
        // Broadcast game start to all room participants with proper synchronization
        console.log('🎮 Broadcasting game_started for new game to room:', gameData.roomId);
        if (roomConnections.has(gameData.roomId)) {
          const roomUsers = roomConnections.get(gameData.roomId)!;
          console.log(`🎮 Broadcasting to ${roomUsers.size} users in room`);
          const broadcastPromises: Promise<void>[] = [];
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              console.log(`🎮 Sending game_started to user: ${connection.userId}`);
              const sendPromise = new Promise<void>((resolve) => {
                try {
                  connection.ws.send(JSON.stringify({
                    type: 'game_started',
                    game: gameWithPlayers,
                    roomId: gameData.roomId,
                  }));
                  setTimeout(resolve, 10);
                } catch (error) {
                  console.error(`🎮 Error sending to user ${connection.userId}:`, error);
                  resolve();
                }
              });
              broadcastPromises.push(sendPromise);
            }
          });
          await Promise.all(broadcastPromises);
        }
      }

      setTimeout(() => {
        res.json(gameWithPlayers);
      }, 50);
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

      // Validate game ID format (UUID)
      if (!gameId || typeof gameId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId)) {
        return res.status(400).json({ message: "Invalid game ID format" });
      }

      // Validate position
      if (typeof position !== 'number' || !Number.isInteger(position) || position < 1 || position > 15) {
        return res.status(400).json({ message: "Position must be an integer between 1 and 15" });
      }

      // Move request processing

      // Always fetch fresh game state to avoid stale data
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Validating game state

      if (game.status !== 'active') {
        console.log(`❌ MOVE REJECTED: Game status is ${game.status}, not active`);
        return res.status(400).json({ message: `Game is not active (status: ${game.status})` });
      }

      // Validate it's the player's turn
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;
      
      // Validating player roles
      
      if (!isPlayerX && !isPlayerO) {
        console.log(`❌ MOVE REJECTED: User ${userId} is not a player in this game`);
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';
      // Validating turn
      
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
          // Checking achievements for winner
          try {
            const newAchievements = await storage.checkAndGrantAchievements(userId, 'win', {
              winCondition: winResult.condition,
              isOnlineGame: true
            });
            // Achievement processing completed
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
        
        // Update room status back to waiting so new games can start
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'waiting');
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
                  } : (game.playerOId && AI_BOTS.some(bot => bot.id === game.playerOId) ? {
                    displayName: AI_BOTS.find(bot => bot.id === game.playerOId)?.displayName || 'AI Player',
                    firstName: AI_BOTS.find(bot => bot.id === game.playerOId)?.firstName || 'AI',
                    username: AI_BOTS.find(bot => bot.id === game.playerOId)?.username || 'ai',
                    profilePicture: AI_BOTS.find(bot => bot.id === game.playerOId)?.profilePicture || null,
                    profileImageUrl: AI_BOTS.find(bot => bot.id === game.playerOId)?.profilePicture || null
                  } : null)
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
        
        // Update room status back to waiting so new games can start
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'waiting');
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
        
        // Add a small delay to ensure database transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify the update was successful by fetching fresh game state
        const updatedGame = await storage.getGameById(gameId);
        // Move successful, broadcasting to room
        
        // Broadcast move to room AFTER updating current player (INCLUDING SPECTATORS)
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;
          
          // Get player information with achievements for the move broadcast (parallel fetch for speed)
          const [playerXInfo, playerOInfo] = await Promise.all([
            storage.getUser(game.playerXId),
            game.playerOId !== 'AI' && !AI_BOTS.some(bot => bot.id === game.playerOId) ? 
              storage.getUser(game.playerOId) : 
              Promise.resolve(AI_BOTS.find(bot => bot.id === game.playerOId) || null)
          ]);
          

          
          // Get achievements for both players
          const [playerXAchievements, playerOAchievements] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
            playerOInfo && !AI_BOTS.some(bot => bot.id === game.playerOId) ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
          ]);
          
          // Use the verified current player from database
          const actualCurrentPlayer = updatedGame?.currentPlayer || nextPlayer;
          
          // Calculate remaining time for timer synchronization - use original game creation time, not last move
          const currentTime = new Date();
          const gameStartTime = new Date(game.createdAt);
          const timeElapsed = currentTime.getTime() - gameStartTime.getTime();
          const timeRemaining = Math.max(0, 10 * 60 * 1000 - timeElapsed);

          // Prepare the message once to avoid JSON.stringify overhead
          const moveMessage = JSON.stringify({
            type: 'move',
            gameId,
            roomId: game.roomId,
            position,
            player: playerSymbol,
            board: newBoard,
            currentPlayer: actualCurrentPlayer,
            serverTime: currentTime.toISOString(),
            timeRemaining: timeRemaining,
            lastMoveAt: updatedGame?.lastMoveAt || game.lastMoveAt,
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
              profileImageUrl: playerOInfo.profilePicture || playerOInfo.profileImageUrl,
              achievements: playerOAchievements.slice(0, 3)
            } : (game.playerOId && AI_BOTS.some(bot => bot.id === game.playerOId) ? {
              displayName: AI_BOTS.find(bot => bot.id === game.playerOId)?.displayName || 'AI Player',
              firstName: AI_BOTS.find(bot => bot.id === game.playerOId)?.firstName || 'AI',
              username: AI_BOTS.find(bot => bot.id === game.playerOId)?.username || 'ai',
              profilePicture: AI_BOTS.find(bot => bot.id === game.playerOId)?.profilePicture || null,
              profileImageUrl: AI_BOTS.find(bot => bot.id === game.playerOId)?.profilePicture || null,
              achievements: []
            } : null)
          });
          
          // Broadcast move to all room users
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(moveMessage);
            }
          });
        }
        
        // Handle Bot move if it's an online game against a bot
        const isGameAgainstBot = game.playerOId && AI_BOTS.some(bot => bot.id === game.playerOId);
        if (game.gameMode === 'online' && isGameAgainstBot && nextPlayer === 'O') {
          // Bot's turn to make a move
          setTimeout(async () => {
            try {
              // Find the bot information
              const botInfo = AI_BOTS.find(bot => bot.id === game.playerOId);
              if (!botInfo) {
                console.error(`🤖 Bot not found: ${game.playerOId}`);
                return;
              }
              
              // Create AI player with bot's difficulty
              const aiBot = new AIPlayer('O', botInfo.difficulty);
              const botMove = aiBot.makeMove(newBoard);
              
              // Bot selected move
              
              const botBoard = makeMove(newBoard, botMove, 'O');
              
              // Save bot move
              await storage.createMove({
                gameId,
                playerId: game.playerOId,
                position: botMove,
                symbol: 'O',
                moveNumber: moveCount.length + 2,
              });
              
              await storage.updateGameBoard(gameId, botBoard);
              
              // Check bot win
              const botWinResult = checkWin(botBoard, 'O');
              if (botWinResult.winner) {
                await storage.updateGameStatus(gameId, 'finished', game.playerOId, botWinResult.condition || undefined);
                await storage.updateUserStats(userId, 'loss'); // User loses to bot
                
                // Check and grant achievements for the human player (they lost to bot)
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                  try {
                    await storage.checkAndGrantAchievements(userId, 'loss', {
                      winCondition: botWinResult.condition,
                      isOnlineGame: true,
                      againstBot: true
                    });
                  } catch (error) {
                    console.error('🏆 Error checking achievements for user (lost to bot):', error);
                  }
                }
                
                // Broadcast bot win to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  
                  // First broadcast the winning move with highlight
                  const winningMoveMessage = JSON.stringify({
                    type: 'winning_move',
                    gameId,
                    position: botMove,
                    player: 'O',
                    board: botBoard,
                    currentPlayer: 'X',
                    winningPositions: botWinResult.winningPositions || [],
                    roomId: game.roomId
                  });
                  
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(winningMoveMessage);
                    }
                  });
                  
                  // Then broadcast game over after 2.5 seconds
                  setTimeout(async () => {
                    const playerXInfo = await storage.getUser(game.playerXId);
                    
                    roomUsers.forEach(connectionId => {
                      const connection = connections.get(connectionId);
                      if (connection && connection.ws.readyState === WebSocket.OPEN) {
                        connection.ws.send(JSON.stringify({
                          type: 'game_over',
                          gameId,
                          winner: 'O',
                          condition: botWinResult.condition,
                          board: botBoard,
                          winnerInfo: {
                            displayName: botInfo.displayName,
                            firstName: botInfo.firstName,
                            username: botInfo.username,
                            profilePicture: botInfo.profilePicture,
                            profileImageUrl: botInfo.profilePicture
                          },
                          playerXInfo: playerXInfo ? {
                            displayName: playerXInfo.displayName,
                            firstName: playerXInfo.firstName,
                            username: playerXInfo.username,
                            profilePicture: playerXInfo.profilePicture,
                            profileImageUrl: playerXInfo.profileImageUrl
                          } : null,
                          playerOInfo: {
                            displayName: botInfo.displayName,
                            firstName: botInfo.firstName,
                            username: botInfo.username,
                            profilePicture: botInfo.profilePicture,
                            profileImageUrl: botInfo.profilePicture
                          }
                        }));
                      }
                    });
                  }, 2500);
                }
              } else if (checkDraw(botBoard)) {
                await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
                await storage.updateUserStats(userId, 'draw'); // User draws with bot
                
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                  try {
                    await storage.checkAndGrantAchievements(userId, 'draw', {
                      winCondition: 'draw',
                      isOnlineGame: true,
                      againstBot: true
                    });
                  } catch (error) {
                    console.error('🏆 Error checking achievements for user (draw with bot):', error);
                  }
                }
                
                // Broadcast draw to room
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
                        board: botBoard,
                      }));
                    }
                  });
                }
              } else {
                // Bot made a move, switch back to human player
                await storage.updateCurrentPlayer(gameId, 'X');
                
                // Broadcast bot move to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  const playerXInfo = await storage.getUser(game.playerXId);
                  const playerXAchievements = playerXInfo ? await storage.getUserAchievements(game.playerXId) : [];
                  

                  
                  const botMoveMessage = JSON.stringify({
                    type: 'move',
                    gameId,
                    roomId: game.roomId,
                    position: botMove,
                    player: 'O',
                    board: botBoard,
                    currentPlayer: 'X',
                    playerXInfo: playerXInfo ? {
                      displayName: playerXInfo.displayName,
                      firstName: playerXInfo.firstName,
                      username: playerXInfo.username,
                      profilePicture: playerXInfo.profilePicture,
                      profileImageUrl: playerXInfo.profileImageUrl,
                      achievements: playerXAchievements.slice(0, 3)
                    } : null,
                    playerOInfo: {
                      displayName: botInfo.displayName,
                      firstName: botInfo.firstName,
                      username: botInfo.username,
                      profilePicture: botInfo.profilePicture,
                      profileImageUrl: botInfo.profilePicture,
                      achievements: []
                    }
                  });
                  
                  // Broadcasting bot move to room users
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(botMoveMessage);
                    }
                  });
                }
              }
            } catch (error) {
              console.error('🤖 Error in bot move handling:', error);
            }
          }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds for realistic bot behavior
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
                  await storage.updateRoomStatus(game.roomId, 'waiting');
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
                  await storage.updateRoomStatus(game.roomId, 'waiting');
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
    // New WebSocket connection
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            // WebSocket authenticated
            
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
            
            // Check for active game reconnection
            await handleUserReconnection(data.userId, connectionId, ws);
            
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
              // User joining room
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
              // Room connection updated
              
              // If there's an active game in this room, send the game state to the joining user
              // BUT only if this is NOT a reconnection (to prevent duplicate notifications)
              if (activeGame && activeGame.status === 'active') {
                // Check if this is a reconnection (user was recently reconnected)
                const now = Date.now();
                const lastReconnection = recentReconnections.get(connection.userId);
                const isRecentReconnection = lastReconnection && (now - lastReconnection) < 3000; // 3 second window
                
                if (!isRecentReconnection) {
                  console.log(`🎮 Sending active game state to joining user ${connection.userId} (not a reconnection)`);
                  
                  // Get player information with achievements
                  const [playerXInfo, playerOInfo] = await Promise.all([
                    storage.getUser(activeGame.playerXId),
                    activeGame.playerOId && activeGame.playerOId !== 'AI' ? storage.getUser(activeGame.playerOId) : Promise.resolve(null)
                  ]);
                  
                  // Get achievements for both players
                  const [playerXAchievements, playerOAchievements] = await Promise.all([
                    playerXInfo ? storage.getUserAchievements(activeGame.playerXId) : Promise.resolve([]),
                    playerOInfo ? storage.getUserAchievements(activeGame.playerOId) : Promise.resolve([])
                  ]);
                  
                  const gameWithPlayers = {
                    ...activeGame,
                    playerXInfo: playerXInfo ? {
                      ...playerXInfo,
                      achievements: playerXAchievements.slice(0, 3)
                    } : playerXInfo,
                    playerOInfo: playerOInfo ? {
                      ...playerOInfo,
                      achievements: playerOAchievements.slice(0, 3)
                    } : playerOInfo,
                    gameMode: 'online'
                  };
                  
                  // Send game state to the joining user
                  connection.ws.send(JSON.stringify({
                    type: 'game_started',
                    game: gameWithPlayers,
                    gameId: activeGame.id,
                    roomId: data.roomId,
                  }));
                } else {
                  console.log(`🔄 Skipping game state send for ${connection.userId} - recent reconnection detected`);
                }
              }
              
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
              // Use userId from connection object instead of message data for security
              const userId = conn.userId;
              const playerName = conn.displayName || conn.username || 'Unknown Player';
              
              // Processing room leave request
              
              // Check if user is in an active game
              const userState = userRoomStates.get(userId);
              const activeGame = await storage.getActiveGameByRoomId(roomId);
              const room = await storage.getRoomById(roomId);
              
              // Checking active game for room
              
              // Check both game status AND room status to catch "Play Again" scenarios
              const isInActiveGame = activeGame && activeGame.status === 'active' && 
                  (activeGame.playerXId === userId || activeGame.playerOId === userId);
              const isRoomInPlayingState = room && room.status === 'playing';
              
              if (isInActiveGame || (isRoomInPlayingState && activeGame && 
                  (activeGame.playerXId === userId || activeGame.playerOId === userId))) {
                // Player leaving active game - terminating
                
                // Mark game as finished due to player leaving - this persists in database
                await storage.finishGame(activeGame.id, {
                  status: 'abandoned',
                  winningPlayer: null,
                  winningPositions: [],
                  updatedAt: new Date()
                });
                
                // Game permanently ended in database
                
                // Game marked as abandoned
                
                // Get all users in the room (players and spectators)
                const roomUsers = roomConnections.get(roomId);
                if (roomUsers && roomUsers.size > 0) {
                  const gameEndMessage = JSON.stringify({
                    type: 'game_abandoned',
                    roomId,
                    gameId: activeGame.id,
                    leavingPlayer: playerName,
                    message: `Game ended - ${playerName} left the room`,
                    redirectToHome: true
                  });
                  
                  // Track unique users to prevent duplicate messages
                  const notifiedUsers = new Set<string>();
                  const connectionsToSend: string[] = [];
                  
                  // Filter to send only one message per unique user
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN && connection.userId) {
                      if (!notifiedUsers.has(connection.userId)) {
                        notifiedUsers.add(connection.userId);
                        connectionsToSend.push(connectionId);
                      }
                    }
                  });
                  
                  console.log(`🏠 Broadcasting game abandonment to ${connectionsToSend.length} unique users in room ${roomId}`);
                  
                  // Send to unique users only
                  connectionsToSend.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(gameEndMessage);
                      
                      // Clear their room state immediately
                      const connUserId = connection.userId;
                      if (connUserId) {
                        userRoomStates.delete(connUserId);
                        const onlineUser = onlineUsers.get(connUserId);
                        if (onlineUser) {
                          onlineUser.roomId = undefined;
                        }
                      }
                      
                      // Clear their connection room info
                      connection.roomId = undefined;
                    }
                  });
                  
                  // Clear remaining duplicate connections
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection) {
                      connection.roomId = undefined;
                    }
                  });
                  
                  // Clear the entire room
                  roomConnections.delete(roomId);
                  // Room completely cleared
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
                  
                  // Broadcasting room end to remaining users
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
                  // Room cleared - no users remaining
                }
              }
              
              conn.roomId = undefined;
            }
            break;
            
          case 'player_reaction':
            // Handle player reaction and broadcast to all users in the room
            const { roomId, gameId, userId, playerSymbol, reactionType, emoji, playerInfo } = data;
            
            // Player reaction received
            
            // Broadcast reaction to all users in the room
            const roomUsers = roomConnections.get(roomId);
            if (roomUsers && roomUsers.size > 0) {
              const reactionMessage = JSON.stringify({
                type: 'player_reaction',
                roomId,
                gameId,
                userId,
                playerSymbol,
                reactionType,
                emoji,
                playerInfo,
                timestamp: Date.now()
              });
              
              console.log(`🎭 Broadcasting reaction to ${roomUsers.size} users in room ${roomId}`);
              let broadcastCount = 0;
              roomUsers.forEach(connId => {
                const conn = connections.get(connId);
                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(reactionMessage);
                  broadcastCount++;
                  console.log(`🎭 Sent reaction to user: ${conn.userId}`);
                }
              });
              console.log(`🎭 Successfully broadcast reaction to ${broadcastCount} users`);
            } else {
              console.log(`🎭 No room users found for room ${roomId} or room is empty`);
            }
            break;
            
          case 'player_chat':
            // Handle player chat message and broadcast to all users in the room
            const { roomId: chatRoomId, gameId: chatGameId, userId: chatUserId, playerSymbol: chatPlayerSymbol, messageText, playerInfo: chatPlayerInfo } = data;
            
            // console.log(`💬 Player chat from ${chatUserId} in room ${chatRoomId}: ${messageText} (${chatPlayerSymbol})`);
            
            // Broadcast chat message to all users in the room
            const chatRoomUsers = roomConnections.get(chatRoomId);
            if (chatRoomUsers && chatRoomUsers.size > 0) {
              const chatMessage = JSON.stringify({
                type: 'player_chat',
                roomId: chatRoomId,
                gameId: chatGameId,
                userId: chatUserId,
                playerSymbol: chatPlayerSymbol,
                messageText,
                playerInfo: chatPlayerInfo,
                timestamp: Date.now()
              });
              
              // console.log(`💬 Broadcasting chat to ${chatRoomUsers.size} users in room ${chatRoomId}`);
              let broadcastCount = 0;
              chatRoomUsers.forEach(connId => {
                const conn = connections.get(connId);
                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(chatMessage);
                  broadcastCount++;
                  // console.log(`💬 Sent chat to user: ${conn.userId}`);
                }
              });
              // console.log(`💬 Successfully broadcast chat to ${broadcastCount} users`);
            } else {
              console.log(`💬 No room users found for room ${chatRoomId} or room is empty`);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {

      
      // Get user info before cleaning up
      const connection = connections.get(connectionId);
      
      if (connection) {
        // Check if user has other active connections
        const userHasOtherConnections = Array.from(connections.values()).some(
          conn => conn.userId === connection.userId && conn.ws !== ws
        );
        
        // Only remove from online users if no other connections exist
        if (!userHasOtherConnections) {
          // Check if user is in active game by checking both memory state and database
          const userState = userRoomStates.get(connection.userId);
          const activeGame = await storage.getActiveGameForUser(connection.userId);
          const isReallyInActiveGame = activeGame && activeGame.status === 'active';
          
          if (userState && userState.isInGame && isReallyInActiveGame) {
            console.log(`🏠 User ${connection.userId} disconnected but is in active game - keeping in room`);
            // Update last seen time but don't remove
            const onlineUser = onlineUsers.get(connection.userId);
            if (onlineUser) {
              onlineUser.lastSeen = new Date();
            }
          } else {
            // Clean up stale userRoomState if game is no longer active
            if (userState && userState.isInGame && !isReallyInActiveGame) {
              console.log(`🏠 Cleaning up stale room state for user ${connection.userId} - game no longer active`);
              userRoomStates.delete(connection.userId);
            }
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
      
      // Check if user has other connections BEFORE deleting this one
      const userHasOtherConnectionsAfterDelete = connection ? 
        Array.from(connections.values()).some(conn => conn.userId === connection.userId && conn.ws !== ws) : false;
      
      // Clean up connection
      connections.delete(connectionId);
      
      // Remove from room connections only if user doesn't have other connections
      if (connection && !userHasOtherConnectionsAfterDelete) {
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
                // Room cleared - no users remaining
              }
            }
          }
        }
      }
    });
  });

  return httpServer;
}
