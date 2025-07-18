import {
  users,
  rooms,
  games,
  moves,
  roomParticipants,
  blockedUsers,
  achievements,
  userThemes,
  friendRequests,
  friendships,
  roomInvitations,
  type User,
  type UpsertUser,
  type Room,
  type Game,
  type Move,
  type RoomParticipant,
  type BlockedUser,
  type Achievement,
  type UserTheme,
  type FriendRequest,
  type Friendship,
  type RoomInvitation,
  type InsertRoom,
  type InsertGame,
  type InsertMove,
  type InsertRoomParticipant,
  type InsertBlockedUser,
  type InsertAchievement,
  type InsertUserTheme,
  type InsertFriendRequest,
  type InsertFriendship,
  type InsertRoomInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, or, ne, isNull, isNotNull, sql, exists, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByName(name: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Room operations
  createRoom(room: InsertRoom & { ownerId: string }): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoomById(id: string): Promise<Room | undefined>;
  updateRoomStatus(id: string, status: string): Promise<void>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: string): Promise<Game | undefined>;
  getActiveGameByRoomId(roomId: string): Promise<Game | undefined>;
  updateGameBoard(gameId: string, board: Record<string, string>): Promise<void>;
  updateGameStatus(gameId: string, status: string, winnerId?: string, winCondition?: string): Promise<void>;
  updateCurrentPlayer(gameId: string, currentPlayer: string): Promise<void>;
  
  // Move operations
  createMove(move: InsertMove): Promise<Move>;
  getGameMoves(gameId: string): Promise<Move[]>;
  
  // Room participant operations
  addRoomParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]>;
  removeRoomParticipant(roomId: string, userId: string): Promise<void>;
  
  // Statistics
  updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void>;
  getUserStats(userId: string): Promise<{ wins: number; losses: number; draws: number }>;
  getOnlineGameStats(userId: string): Promise<{ wins: number; losses: number; draws: number; totalGames: number }>;
  
  // Blocked Users
  blockUser(blockerId: string, blockedId: string): Promise<BlockedUser>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<BlockedUser[]>;
  isUserBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  
  // Player Rankings
  getPlayerRankings(sortBy: string): Promise<any[]>;
  
  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  hasAchievement(userId: string, achievementType: string): Promise<boolean>;
  checkAndGrantAchievements(userId: string, gameResult: 'win' | 'loss' | 'draw', gameData?: any): Promise<Achievement[]>;
  
  // Theme operations
  unlockTheme(userId: string, themeName: string): Promise<UserTheme>;
  getUserThemes(userId: string): Promise<UserTheme[]>;
  isThemeUnlocked(userId: string, themeName: string): Promise<boolean>;
  
  // Friend operations
  sendFriendRequest(requesterId: string, requestedId: string): Promise<FriendRequest>;
  getFriendRequests(userId: string): Promise<(FriendRequest & { requester: User; requested: User })[]>;
  respondToFriendRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  cleanupFriendshipData(): Promise<void>;
  getHeadToHeadStats(userId: string, friendId: string): Promise<{
    totalGames: number;
    userWins: number;
    friendWins: number;
    draws: number;
    userWinRate: number;
    friendWinRate: number;
  }>;

  // Room Invitation operations
  createRoomInvitationsTable(): Promise<void>;
  sendRoomInvitation(roomId: string, inviterId: string, invitedId: string): Promise<RoomInvitation>;
  getRoomInvitations(userId: string): Promise<(RoomInvitation & { room: Room; inviter: User; invited: User })[]>;
  respondToRoomInvitation(invitationId: string, response: 'accepted' | 'rejected'): Promise<void>;
  expireOldInvitations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Database initialization
  async createRoomInvitationsTable(): Promise<void> {
    // First create the table without foreign key constraints
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS room_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        inviter_id VARCHAR NOT NULL,
        invited_id VARCHAR NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 seconds'),
        UNIQUE(room_id, invited_id)
      )
    `);
    
    // Add foreign key constraints if they don't exist
    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }
    
    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_inviter_id_fkey 
        FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }
    
    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_invited_id_fkey 
        FOREIGN KEY (invited_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByName(name: string): Promise<User[]> {
    const searchTerm = `%${name}%`;
    const usersByName = await db.select().from(users).where(
      or(
        sql`LOWER(${users.firstName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.lastName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.displayName}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.username}) LIKE LOWER(${searchTerm})`,
        sql`LOWER(${users.firstName} || ' ' || ${users.lastName}) LIKE LOWER(${searchTerm})`
      )
    ).limit(10);
    return usersByName;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Room operations
  async createRoom(roomData: InsertRoom & { ownerId: string }): Promise<Room> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const [room] = await db
      .insert(rooms)
      .values({
        ...roomData,
        code,
      })
      .returning();
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoomStatus(id: string, status: string): Promise<void> {
    await db.update(rooms).set({ status }).where(eq(rooms.id, id));
  }

  // Game operations
  async createGame(gameData: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(gameData).returning();
    return game;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getActiveGameByRoomId(roomId: string): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.roomId, roomId), eq(games.status, "active")))
      .orderBy(desc(games.createdAt));
    return game;
  }

  async updateGameBoard(gameId: string, board: Record<string, string>): Promise<void> {
    await db.update(games).set({ board }).where(eq(games.id, gameId));
  }

  async updateGameStatus(gameId: string, status: string, winnerId?: string, winCondition?: string): Promise<void> {
    const updateData: any = { status };
    if (winnerId) updateData.winnerId = winnerId;
    if (winCondition) updateData.winCondition = winCondition;
    if (status === "finished") updateData.finishedAt = new Date();
    
    await db.update(games).set(updateData).where(eq(games.id, gameId));

    // Check for achievements when game is finished
    if (status === 'finished') {
      const [game] = await db.select().from(games).where(eq(games.id, gameId));
      if (game && game.playerXId && game.playerOId) {
        const gameData = { winCondition, gameId };
        
        // Check achievements for both players
        if (winnerId) {
          // Winner achievements
          await this.checkAndGrantAchievements(winnerId, 'win', gameData);
          
          // Loser achievements
          const loserId = winnerId === game.playerXId ? game.playerOId : game.playerXId;
          await this.checkAndGrantAchievements(loserId, 'loss', gameData);
        } else {
          // Draw achievements for both players
          await this.checkAndGrantAchievements(game.playerXId, 'draw', gameData);
          await this.checkAndGrantAchievements(game.playerOId, 'draw', gameData);
        }
      }
    }
  }

  async updateCurrentPlayer(gameId: string, currentPlayer: string): Promise<void> {
    await db.update(games).set({ currentPlayer }).where(eq(games.id, gameId));
  }

  // Move operations
  async createMove(moveData: InsertMove): Promise<Move> {
    const [move] = await db.insert(moves).values(moveData).returning();
    return move;
  }

  async getGameMoves(gameId: string): Promise<Move[]> {
    return await db
      .select()
      .from(moves)
      .where(eq(moves.gameId, gameId))
      .orderBy(moves.moveNumber);
  }

  // Room participant operations
  async addRoomParticipant(participantData: InsertRoomParticipant): Promise<RoomParticipant> {
    const [participant] = await db.insert(roomParticipants).values(participantData).returning();
    return participant;
  }

  async getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]> {
    return await db
      .select({
        id: roomParticipants.id,
        roomId: roomParticipants.roomId,
        userId: roomParticipants.userId,
        role: roomParticipants.role,
        joinedAt: roomParticipants.joinedAt,
        user: users,
      })
      .from(roomParticipants)
      .innerJoin(users, eq(roomParticipants.userId, users.id))
      .where(eq(roomParticipants.roomId, roomId));
  }

  async removeRoomParticipant(roomId: string, userId: string): Promise<void> {
    await db
      .delete(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)));
  }

  // Statistics
  async updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const updates: any = {};
    if (result === 'win') updates.wins = (user.wins || 0) + 1;
    if (result === 'loss') updates.losses = (user.losses || 0) + 1;
    if (result === 'draw') updates.draws = (user.draws || 0) + 1;

    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  async recalculateUserStats(userId: string): Promise<void> {
    // Get all finished games for this user
    const userGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.status, 'finished'),
        or(
          eq(games.playerXId, userId),
          eq(games.playerOId, userId)
        )
      ));

    let wins = 0;
    let losses = 0;
    let draws = 0;

    userGames.forEach(game => {
      if (game.winnerId === userId) {
        wins++;
      } else if (game.winnerId === null) {
        draws++;
      } else {
        losses++;
      }
    });

    // Update user stats in database
    await db.update(users).set({
      wins: wins,
      losses: losses,
      draws: draws
    }).where(eq(users.id, userId));
  }

  async recalculateAllUserStats(): Promise<void> {
    // Get all users who have played games
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

    console.log(`🔄 Recalculating stats for ${allUsers.length} users...`);

    for (const user of allUsers) {
      await this.recalculateUserStats(user.id);
      console.log(`✅ Updated stats for user: ${user.id}`);
    }

    console.log('🎉 User stats recalculation completed!');
  }

  async getUserStats(userId: string): Promise<{ wins: number; losses: number; draws: number }> {
    const user = await this.getUser(userId);
    return {
      wins: user?.wins || 0,
      losses: user?.losses || 0,
      draws: user?.draws || 0,
    };
  }

  async getOnlineGameStats(userId: string): Promise<{ wins: number; losses: number; draws: number; totalGames: number }> {
    // Since we're properly updating user stats in the database, just return the user's stats
    // This represents their online game performance since we only update stats for online games
    const user = await this.getUser(userId);
    if (!user) {
      return { wins: 0, losses: 0, draws: 0, totalGames: 0 };
    }

    const wins = user.wins || 0;
    const losses = user.losses || 0;
    const draws = user.draws || 0;

    return {
      wins,
      losses,
      draws,
      totalGames: wins + losses + draws
    };
  }

  // Blocked Users methods
  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    const [blocked] = await db
      .insert(blockedUsers)
      .values({ blockerId, blockedId })
      .onConflictDoNothing()
      .returning();
    return blocked;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)));
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return await db.select().from(blockedUsers).where(eq(blockedUsers.blockerId, userId));
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)));
    return !!blocked;
  }

  async getPlayerRankings(sortBy: string): Promise<any[]> {
    try {
      // Get all users with their online game stats
      const usersWithStats = await db.select({
        userId: users.id,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        wins: users.wins,
        losses: users.losses,
        draws: users.draws,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        sql`${users.wins} + ${users.losses} + ${users.draws} > 0`
      );

      // Calculate rankings with additional metrics
      const rankings = await Promise.all(
        usersWithStats.map(async (user, index) => {
          const totalGames = user.wins + user.losses + user.draws;
          const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
          
          // Get recent games for streak calculation
          const recentGames = await db.select({
            winnerId: games.winnerId,
            status: games.status,
            createdAt: games.createdAt
          })
          .from(games)
          .where(
            and(
              or(
                eq(games.playerXId, user.userId),
                eq(games.playerOId, user.userId)
              ),
              eq(games.gameMode, 'online'),
              eq(games.status, 'finished')
            )
          )
          .orderBy(desc(games.createdAt))
          .limit(10);

          // Calculate current streak
          let streak = 0;
          let streakType: 'win' | 'loss' | 'draw' = 'win';
          
          if (recentGames.length > 0) {
            const latestGame = recentGames[0];
            if (latestGame.winnerId === user.userId) {
              streakType = 'win';
            } else if (latestGame.winnerId === null) {
              streakType = 'draw';
            } else {
              streakType = 'loss';
            }

            // Count consecutive games with same result
            for (const game of recentGames) {
              let gameResult: 'win' | 'loss' | 'draw';
              if (game.winnerId === user.userId) {
                gameResult = 'win';
              } else if (game.winnerId === null) {
                gameResult = 'draw';
              } else {
                gameResult = 'loss';
              }

              if (gameResult === streakType) {
                streak++;
              } else {
                break;
              }
            }
          }

          return {
            userId: user.userId,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            wins: user.wins,
            losses: user.losses,
            draws: user.draws,
            totalGames,
            winRate,
            streak,
            streakType,
            rankChange: 0, // Would need previous rankings to calculate
            createdAt: user.createdAt
          };
        })
      );

      // Sort rankings based on sortBy parameter
      let sortedRankings;
      switch (sortBy) {
        case 'wins':
          sortedRankings = rankings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate; // Secondary sort by win rate
          });
          break;
        case 'totalGames':
          sortedRankings = rankings.sort((a, b) => {
            if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames;
            return b.winRate - a.winRate; // Secondary sort by win rate
          });
          break;
        case 'winRate':
        default:
          sortedRankings = rankings.sort((a, b) => {
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames; // Secondary sort by total games
            return b.wins - a.wins; // Tertiary sort by wins
          });
          break;
      }

      // Add rank numbers
      return sortedRankings.map((player, index) => ({
        ...player,
        rank: index + 1
      }));
      
    } catch (error) {
      console.error('Error fetching player rankings:', error);
      throw error;
    }
  }

  // Achievement operations
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .onConflictDoNothing()
      .returning();
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    // First get current achievements
    const currentAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));

    // Auto-validate achievements if user has any
    if (currentAchievements.length > 0) {
      await this.validateUserAchievements(userId);
      
      // Get updated achievements after validation
      return await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId))
        .orderBy(desc(achievements.unlockedAt));
    }

    return currentAchievements;
  }

  async hasAchievement(userId: string, achievementType: string): Promise<boolean> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.userId, userId),
        eq(achievements.achievementType, achievementType)
      ));
    return !!achievement;
  }

  async validateUserAchievements(userId: string): Promise<void> {
    try {
      // Get current user stats
      const userStats = await this.getUserStats(userId);
      const totalGames = userStats.wins + userStats.losses + userStats.draws;
      
      // Get existing achievements
      const existingAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));
      
      // Define what achievements should exist
      const shouldHaveAchievements = [];
      
      if (userStats.wins >= 1) shouldHaveAchievements.push('first_win');
      if (userStats.wins >= 20) shouldHaveAchievements.push('speed_demon');
      if (userStats.wins >= 50) shouldHaveAchievements.push('legend');
      if (userStats.wins >= 100) shouldHaveAchievements.push('champion');
      if (userStats.wins >= 200) shouldHaveAchievements.push('grandmaster');
      if (totalGames >= 100) shouldHaveAchievements.push('veteran_player');
      if (totalGames >= 500) shouldHaveAchievements.push('ultimate_veteran');
      
      // Check for incorrect achievements
      const incorrectAchievements = existingAchievements.filter(
        achievement => !shouldHaveAchievements.includes(achievement.achievementType)
      );
      
      // Remove incorrect achievements
      if (incorrectAchievements.length > 0) {
        console.log(`🔄 Auto-removing ${incorrectAchievements.length} incorrect achievements for user: ${userId}`);
        await db
          .delete(achievements)
          .where(and(
            eq(achievements.userId, userId),
            inArray(achievements.achievementType, incorrectAchievements.map(a => a.achievementType))
          ));
      }
      
      // Add missing achievements
      const existingTypes = existingAchievements.map(a => a.achievementType);
      const missingAchievements = shouldHaveAchievements.filter(
        type => !existingTypes.includes(type)
      );
      
      if (missingAchievements.length > 0) {
        console.log(`🔄 Auto-adding ${missingAchievements.length} missing achievements for user: ${userId}`);
        
        const achievementData = {
          'first_win': { name: 'firstVictoryTitle', description: 'winYourVeryFirstGame', icon: '🏆' },
          'speed_demon': { name: 'speedDemon', description: 'winTwentyTotalGames', icon: '⚡' },
          'legend': { name: 'legend', description: 'achieveFiftyTotalWins', icon: '🌟' },
          'champion': { name: 'champion', description: 'achieveOneHundredTotalWins', icon: '👑' },
          'grandmaster': { name: 'grandmaster', description: 'achieveTwoHundredTotalWins', icon: '💎' },
          'veteran_player': { name: 'veteranPlayer', description: 'playOneHundredTotalGames', icon: '🎖️' },
          'ultimate_veteran': { name: 'ultimateVeteran', description: 'playFiveHundredTotalGames', icon: '🔥' }
        };
        
        for (const type of missingAchievements) {
          const data = achievementData[type];
          if (data) {
            await db
              .insert(achievements)
              .values({
                userId,
                achievementType: type,
                achievementName: data.name,
                description: data.description,
                icon: data.icon,
                metadata: {},
              })
              .onConflictDoNothing();
          }
        }
      }
    } catch (error) {
      console.error('Error validating achievements:', error);
    }
  }

  async recalculateUserAchievements(userId: string): Promise<{ removed: number; added: Achievement[] }> {
    try {
      console.log(`🔄 Recalculating achievements for user: ${userId}`);
      
      // Get current user stats
      const userStats = await this.getUserStats(userId);
      console.log(`📊 User stats:`, userStats);
      
      // Get existing achievements count first
      const existingAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));
      
      console.log(`🏆 Existing achievements count: ${existingAchievements.length}`);
      
      // Remove all existing achievements for this user
      await db
        .delete(achievements)
        .where(eq(achievements.userId, userId));
      
      const removedCount = existingAchievements.length;
      console.log(`🗑️ Removed ${removedCount} existing achievements`);
      
      // Define correct achievement conditions based on current stats only
      const newAchievements: Achievement[] = [];
      
      // Only grant achievements that the user actually qualifies for
      const totalGames = userStats.wins + userStats.losses + userStats.draws;
      console.log(`📊 Detailed stats - wins: ${userStats.wins}, losses: ${userStats.losses}, draws: ${userStats.draws}, total: ${totalGames}`);
      
      const achievementRules = [
        {
          type: 'first_win',
          name: 'firstVictoryTitle',
          description: 'winYourVeryFirstGame',
          icon: '🏆',
          condition: userStats.wins >= 1,
        },
        {
          type: 'speed_demon',
          name: 'speedDemon',
          description: 'winTwentyTotalGames',
          icon: '⚡',
          condition: userStats.wins >= 20,
        },
        {
          type: 'legend',
          name: 'legend',
          description: 'achieveFiftyTotalWins',
          icon: '🌟',
          condition: userStats.wins >= 50,
        },
        {
          type: 'champion',
          name: 'champion',
          description: 'achieveOneHundredTotalWins',
          icon: '👑',
          condition: userStats.wins >= 100,
        },
        {
          type: 'veteran_player',
          name: 'veteranPlayer',
          description: 'playOneHundredTotalGames',
          icon: '🎖️',
          condition: totalGames >= 100,
        },
        {
          type: 'grandmaster',
          name: 'grandmaster',
          description: 'achieveTwoHundredTotalWins',
          icon: '💎',
          condition: userStats.wins >= 200,
        },
        {
          type: 'ultimate_veteran',
          name: 'ultimateVeteran',
          description: 'playFiveHundredTotalGames',
          icon: '🔥',
          condition: totalGames >= 500,
        },
      ];

      // Grant achievements based on current stats
      for (const rule of achievementRules) {
        if (rule.condition) {
          try {
            console.log(`✅ Creating achievement: ${rule.type} for user with ${userStats.wins} wins`);
            
            // Create achievement with direct database insert instead of using createAchievement
            const [newAchievement] = await db
              .insert(achievements)
              .values({
                userId,
                achievementType: rule.type,
                achievementName: rule.name,
                description: rule.description,
                icon: rule.icon,
                metadata: {},
              })
              .returning();
            
            if (newAchievement) {
              newAchievements.push(newAchievement);
              console.log(`✅ Achievement created: ${rule.type}`);
            }
          } catch (error) {
            console.error(`❌ Error creating achievement ${rule.type}:`, error);
          }
        }
      }

      console.log(`🎉 Added ${newAchievements.length} new achievements`);
      return { removed: removedCount, added: newAchievements };
    } catch (error) {
      console.error('❌ Error during achievement recalculation:', error);
      throw error;
    }
  }

  async checkAndGrantAchievements(userId: string, gameResult: 'win' | 'loss' | 'draw', gameData?: any): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    
    // Get user stats
    const userStats = await this.getUserStats(userId);
    
    // Define achievement conditions - only check milestones when they are exactly reached
    const achievementConditions = [
      {
        type: 'first_win',
        name: 'firstVictoryTitle',
        description: 'winYourVeryFirstGame',
        icon: '🏆',
        condition: gameResult === 'win' && userStats.wins === 1,
      },
      {
        type: 'win_streak_5',
        name: 'winStreakMaster',
        description: 'winFiveConsecutiveGames',
        icon: '🔥',
        condition: gameResult === 'win' && await this.checkWinStreak(userId, 5),
      },
      {
        type: 'win_streak_10',
        name: 'unstoppable',
        description: 'winTenConsecutiveGames',
        icon: '⚡',
        condition: gameResult === 'win' && await this.checkWinStreak(userId, 10),
      },
      {
        type: 'master_of_diagonals',
        name: 'masterOfDiagonals',
        description: 'winThreeGamesDiagonally',
        icon: '🎯',
        condition: gameResult === 'win' && gameData?.winCondition === 'diagonal' && await this.checkDiagonalWins(userId, 3),
      },
      {
        type: 'speed_demon',
        name: 'speedDemon',
        description: 'winTwentyTotalGames',
        icon: '⚡',
        condition: gameResult === 'win' && userStats.wins === 20, // Only when exactly reaching 20 wins
      },
      {
        type: 'veteran_player',
        name: 'veteranPlayer',
        description: 'playOneHundredTotalGames',
        icon: '🎖️',
        condition: (userStats.wins + userStats.losses + userStats.draws) === 100, // Only when exactly reaching 100 games
      },
      {
        type: 'comeback_king',
        name: 'comebackKing',
        description: 'winAfterLosingFive',
        icon: '👑',
        condition: gameResult === 'win' && await this.checkComebackCondition(userId),
      },
      {
        type: 'legend',
        name: 'legend',
        description: 'achieveFiftyTotalWins',
        icon: '🌟',
        condition: gameResult === 'win' && userStats.wins === 50, // Only when exactly reaching 50 wins
      },
      {
        type: 'champion',
        name: 'champion',
        description: 'achieveOneHundredTotalWins',
        icon: '👑',
        condition: gameResult === 'win' && userStats.wins === 100, // Only when exactly reaching 100 wins
      },
      {
        type: 'grandmaster',
        name: 'grandmaster',
        description: 'achieveTwoHundredTotalWins',
        icon: '💎',
        condition: gameResult === 'win' && userStats.wins === 200, // Only when exactly reaching 200 wins
      },
      {
        type: 'ultimate_veteran',
        name: 'ultimateVeteran',
        description: 'playFiveHundredTotalGames',
        icon: '🔥',
        condition: (userStats.wins + userStats.losses + userStats.draws) === 500, // Only when exactly reaching 500 games
      },
    ];

    // Check each achievement condition
    for (const achievement of achievementConditions) {
      if (achievement.condition && !await this.hasAchievement(userId, achievement.type)) {
        try {
          const newAchievement = await this.createAchievement({
            userId,
            achievementType: achievement.type,
            achievementName: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            metadata: gameData || {},
          });
          if (newAchievement) {
            newAchievements.push(newAchievement);
            
            // Unlock special themes for certain achievements
            if (achievement.type === 'win_streak_10') {
              await this.unlockTheme(userId, 'halloween');
            } else if (achievement.type === 'speed_demon') {
              await this.unlockTheme(userId, 'christmas');
            } else if (achievement.type === 'veteran_player') {
              await this.unlockTheme(userId, 'summer');
            }
          }
        } catch (error) {
          console.error('Error creating achievement:', error);
        }
      }
    }

    return newAchievements;
  }

  private async checkWinStreak(userId: string, requiredStreak: number): Promise<boolean> {
    const recentGames = await db
      .select()
      .from(games)
      .where(or(
        eq(games.playerXId, userId),
        eq(games.playerOId, userId)
      ))
      .orderBy(desc(games.finishedAt))
      .limit(requiredStreak);

    if (recentGames.length < requiredStreak) return false;

    let streak = 0;
    for (const game of recentGames) {
      if (game.winnerId === userId) {
        streak++;
      } else {
        break;
      }
    }

    return streak >= requiredStreak;
  }

  private async checkDiagonalWins(userId: string, requiredWins: number): Promise<boolean> {
    const diagonalWins = await db
      .select()
      .from(games)
      .where(and(
        eq(games.winnerId, userId),
        eq(games.winCondition, 'diagonal')
      ));

    return diagonalWins.length >= requiredWins;
  }

  private async checkComebackCondition(userId: string): Promise<boolean> {
    const recentGames = await db
      .select()
      .from(games)
      .where(or(
        eq(games.playerXId, userId),
        eq(games.playerOId, userId)
      ))
      .orderBy(desc(games.finishedAt))
      .limit(6);

    if (recentGames.length < 6) return false;

    // Check if latest game is a win
    const latestGame = recentGames[0];
    if (latestGame.winnerId !== userId) return false;

    // Check if previous 5 games were losses
    for (let i = 1; i < 6; i++) {
      const game = recentGames[i];
      if (game.winnerId === userId || game.winnerId === null) {
        return false;
      }
    }

    return true;
  }

  // Theme operations
  async unlockTheme(userId: string, themeName: string): Promise<UserTheme> {
    const [theme] = await db
      .insert(userThemes)
      .values({
        userId,
        themeName,
        isUnlocked: true,
      })
      .onConflictDoUpdate({
        target: [userThemes.userId, userThemes.themeName],
        set: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      })
      .returning();
    return theme;
  }

  async getUserThemes(userId: string): Promise<UserTheme[]> {
    return await db
      .select()
      .from(userThemes)
      .where(and(
        eq(userThemes.userId, userId),
        eq(userThemes.isUnlocked, true)
      ))
      .orderBy(desc(userThemes.unlockedAt));
  }

  async isThemeUnlocked(userId: string, themeName: string): Promise<boolean> {
    const [theme] = await db
      .select()
      .from(userThemes)
      .where(and(
        eq(userThemes.userId, userId),
        eq(userThemes.themeName, themeName),
        eq(userThemes.isUnlocked, true)
      ));
    return !!theme;
  }

  // Friend operations
  async sendFriendRequest(requesterId: string, requestedId: string): Promise<FriendRequest> {
    // Check if they're already friends
    const alreadyFriends = await this.areFriends(requesterId, requestedId);
    if (alreadyFriends) {
      throw new Error('Users are already friends');
    }

    // Check if friend request already exists (in either direction) - check all statuses
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(or(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.requestedId, requestedId)
        ),
        and(
          eq(friendRequests.requesterId, requestedId),
          eq(friendRequests.requestedId, requesterId)
        )
      ));

    if (existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.status === 'pending') {
        throw new Error('Friend request already exists');
      } else if (request.status === 'accepted') {
        // This should not happen if friendship was properly removed, but clean it up
        await db
          .delete(friendRequests)
          .where(eq(friendRequests.id, request.id));
        console.log('Cleaned up orphaned accepted friend request');
      } else if (request.status === 'rejected') {
        // Allow new request if previous was rejected
        // Delete the old rejected request first
        await db
          .delete(friendRequests)
          .where(eq(friendRequests.id, request.id));
      }
    }

    // Try to insert with error handling for constraint violations
    try {
      const [friendRequest] = await db
        .insert(friendRequests)
        .values({
          requesterId,
          requestedId,
        })
        .returning();
      
      return friendRequest;
    } catch (error: any) {
      // Handle constraint violations
      if (error.code === '23505') {
        // Unique constraint violation - friend request already exists
        throw new Error('Friend request already exists');
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getFriendRequests(userId: string): Promise<(FriendRequest & { requester: User; requested: User })[]> {
    return await db
      .select({
        id: friendRequests.id,
        requesterId: friendRequests.requesterId,
        requestedId: friendRequests.requestedId,
        status: friendRequests.status,
        sentAt: friendRequests.sentAt,
        respondedAt: friendRequests.respondedAt,
        requester: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        requested: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(friendRequests)
      .leftJoin(users, eq(friendRequests.requesterId, users.id))
      .where(and(
        eq(friendRequests.requestedId, userId),
        eq(friendRequests.status, 'pending')
      ))
      .orderBy(desc(friendRequests.sentAt));
  }

  async respondToFriendRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void> {
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId));

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request already responded to');
    }

    // Update friend request status
    await db
      .update(friendRequests)
      .set({
        status: response,
        respondedAt: new Date(),
      })
      .where(eq(friendRequests.id, requestId));

    // If accepted, create friendship
    if (response === 'accepted') {
      const user1Id = request.requesterId < request.requestedId ? request.requesterId : request.requestedId;
      const user2Id = request.requesterId < request.requestedId ? request.requestedId : request.requesterId;

      await db
        .insert(friendships)
        .values({
          user1Id,
          user2Id,
        })
        .onConflictDoNothing();
    }
  }

  async getFriends(userId: string): Promise<User[]> {
    const friends = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        wins: users.wins,
        losses: users.losses,
        draws: users.draws,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(friendships)
      .leftJoin(users, or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, users.id)),
        and(eq(friendships.user2Id, userId), eq(friendships.user1Id, users.id))
      ))
      .where(or(
        eq(friendships.user1Id, userId),
        eq(friendships.user2Id, userId)
      ))
      .orderBy(desc(friendships.becameFriendsAt));

    return friends.map(friend => ({
      id: friend.id!,
      email: friend.email!,
      firstName: friend.firstName!,
      lastName: friend.lastName!,
      profileImageUrl: friend.profileImageUrl!,
      wins: friend.wins!,
      losses: friend.losses!,
      draws: friend.draws!,
      createdAt: friend.createdAt!,
      updatedAt: friend.updatedAt!,
    }));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Delete the friendship record
    await db
      .delete(friendships)
      .where(or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
      ));

    // Also delete any accepted friend requests between these users
    await db
      .delete(friendRequests)
      .where(or(
        and(
          eq(friendRequests.requesterId, userId),
          eq(friendRequests.requestedId, friendId),
          eq(friendRequests.status, 'accepted')
        ),
        and(
          eq(friendRequests.requesterId, friendId),
          eq(friendRequests.requestedId, userId),
          eq(friendRequests.status, 'accepted')
        )
      ));
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
      ));

    return !!friendship;
  }

  async cleanupFriendshipData(): Promise<void> {
    try {
      // Clean up accepted friend requests that don't have corresponding friendships
      const acceptedRequests = await db
        .select()
        .from(friendRequests)
        .where(eq(friendRequests.status, 'accepted'));

      for (const request of acceptedRequests) {
        const friendshipExists = await this.areFriends(request.requesterId, request.requestedId);
        
        if (!friendshipExists) {
          // Delete orphaned accepted friend request instead of creating friendship
          // This prevents the "already friends" error when trying to send new requests
          await db
            .delete(friendRequests)
            .where(eq(friendRequests.id, request.id));
          
          console.log(`Removed orphaned accepted friend request for users: ${request.requesterId} and ${request.requestedId}`);
        }
      }

      // Clean up friend requests that have friendships but are still marked as pending
      const friendshipsList = await db.select().from(friendships);
      
      for (const friendship of friendshipsList) {
        // Check for pending requests between these friends
        const pendingRequests = await db
          .select()
          .from(friendRequests)
          .where(and(
            or(
              and(
                eq(friendRequests.requesterId, friendship.user1Id),
                eq(friendRequests.requestedId, friendship.user2Id)
              ),
              and(
                eq(friendRequests.requesterId, friendship.user2Id),
                eq(friendRequests.requestedId, friendship.user1Id)
              )
            ),
            eq(friendRequests.status, 'pending')
          ));

        // Update pending requests to accepted since friendship exists
        for (const request of pendingRequests) {
          await db
            .update(friendRequests)
            .set({
              status: 'accepted',
              respondedAt: new Date(),
            })
            .where(eq(friendRequests.id, request.id));
          
          console.log(`Updated pending request to accepted for users: ${request.requesterId} and ${request.requestedId}`);
        }
      }

      console.log('Friendship data cleanup completed');
    } catch (error) {
      console.error('Error during friendship data cleanup:', error);
    }
  }

  async getHeadToHeadStats(userId: string, friendId: string): Promise<{
    totalGames: number;
    userWins: number;
    friendWins: number;
    draws: number;
    userWinRate: number;
    friendWinRate: number;
  }> {
    const headToHeadGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.gameMode, 'online'),
        eq(games.status, 'finished'),
        or(
          and(eq(games.playerXId, userId), eq(games.playerOId, friendId)),
          and(eq(games.playerXId, friendId), eq(games.playerOId, userId))
        )
      ));

    const totalGames = headToHeadGames.length;
    let userWins = 0;
    let friendWins = 0;
    let draws = 0;

    headToHeadGames.forEach(game => {
      if (game.winnerId === userId) {
        userWins++;
      } else if (game.winnerId === friendId) {
        friendWins++;
      } else {
        draws++;
      }
    });

    const userWinRate = totalGames > 0 ? Math.round((userWins / totalGames) * 100) : 0;
    const friendWinRate = totalGames > 0 ? Math.round((friendWins / totalGames) * 100) : 0;

    return {
      totalGames,
      userWins,
      friendWins,
      draws,
      userWinRate,
      friendWinRate,
    };
  }

  // Room Invitation operations
  async sendRoomInvitation(roomId: string, inviterId: string, invitedId: string): Promise<RoomInvitation> {
    // First, clean up expired invitations
    await this.expireOldInvitations();
    
    // Remove any existing invitations for this room and user (regardless of status)
    // This ensures we can always send a new invitation
    await db
      .delete(roomInvitations)
      .where(
        and(
          sql`${roomInvitations.roomId}::text = ${roomId}`,
          sql`${roomInvitations.invitedId} = ${invitedId}`
        )
      );
    
    // Check if active invitation already exists (not expired) - this should now be unnecessary but kept as safety check
    const existingInvitation = await db
      .select()
      .from(roomInvitations)
      .where(
        and(
          sql`${roomInvitations.roomId}::text = ${roomId}`,
          sql`${roomInvitations.invitedId} = ${invitedId}`,
          eq(roomInvitations.status, 'pending'),
          sql`${roomInvitations.expiresAt} > NOW()`
        )
      );

    if (existingInvitation.length > 0) {
      throw new Error('Invitation already sent to this user for this room');
    }

    // Create expiration date (30 seconds from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 30);

    const [invitation] = await db
      .insert(roomInvitations)
      .values({
        roomId,
        inviterId,
        invitedId,
        expiresAt,
      })
      .returning();

    return invitation;
  }

  async getRoomInvitations(userId: string): Promise<(RoomInvitation & { room: Room; inviter: User; invited: User })[]> {
    // First, clean up expired invitations
    await this.expireOldInvitations();
    const invitations = await db
      .select({
        id: roomInvitations.id,
        roomId: roomInvitations.roomId,
        inviterId: roomInvitations.inviterId,
        invitedId: roomInvitations.invitedId,
        status: roomInvitations.status,
        invitedAt: roomInvitations.invitedAt,
        respondedAt: roomInvitations.respondedAt,
        expiresAt: roomInvitations.expiresAt,
        room: rooms,
        inviter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        invited: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(roomInvitations)
      .innerJoin(rooms, sql`${roomInvitations.roomId}::text = ${rooms.id}::text`)
      .innerJoin(users, sql`${roomInvitations.inviterId} = ${users.id}`)
      .where(
        and(
          sql`${roomInvitations.invitedId} = ${userId}`,
          eq(roomInvitations.status, 'pending'),
          sql`${roomInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(roomInvitations.invitedAt));

    return invitations.map(inv => ({
      ...inv,
      inviter: inv.inviter,
      invited: inv.invited
    }));
  }

  async respondToRoomInvitation(invitationId: string, response: 'accepted' | 'rejected'): Promise<void> {
    // Clean up expired invitations first
    await this.expireOldInvitations();
    
    await db
      .update(roomInvitations)
      .set({
        status: response,
        respondedAt: new Date(),
      })
      .where(sql`${roomInvitations.id}::text = ${invitationId}`);
  }

  async expireOldInvitations(): Promise<void> {
    try {
      // Update expired invitations to 'expired' status
      await db
        .update(roomInvitations)
        .set({ 
          status: 'expired',
          respondedAt: sql`NOW()`
        })
        .where(
          and(
            eq(roomInvitations.status, 'pending'),
            sql`${roomInvitations.expiresAt} <= NOW()`
          )
        );
    } catch (error) {
      console.error('Error expiring old invitations:', error);
    }
  }
}

export const storage = new DatabaseStorage();
