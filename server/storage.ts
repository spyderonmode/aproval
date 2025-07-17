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
  type InsertRoom,
  type InsertGame,
  type InsertMove,
  type InsertRoomParticipant,
  type InsertBlockedUser,
  type InsertAchievement,
  type InsertUserTheme,
  type InsertFriendRequest,
  type InsertFriendship,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, or, ne, isNull, isNotNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
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
  getHeadToHeadStats(userId: string, friendId: string): Promise<{
    totalGames: number;
    userWins: number;
    friendWins: number;
    draws: number;
    userWinRate: number;
    friendWinRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
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

  async checkAndGrantAchievements(userId: string, gameResult: 'win' | 'loss' | 'draw', gameData?: any): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];
    
    // Get user stats
    const userStats = await this.getUserStats(userId);
    
    // Define achievement conditions
    const achievementConditions = [
      {
        type: 'first_win',
        name: 'First Victory',
        description: 'Win your very first game against any opponent to earn this achievement',
        icon: '🏆',
        condition: gameResult === 'win' && userStats.wins === 1,
      },
      {
        type: 'win_streak_5',
        name: 'Win Streak Master',
        description: 'Win 5 consecutive games without losing to unlock the Halloween theme',
        icon: '🔥',
        condition: gameResult === 'win' && await this.checkWinStreak(userId, 5),
      },
      {
        type: 'win_streak_10',
        name: 'Unstoppable',
        description: 'Win 10 consecutive games without losing - the ultimate challenge!',
        icon: '⚡',
        condition: gameResult === 'win' && await this.checkWinStreak(userId, 10),
      },
      {
        type: 'master_of_diagonals',
        name: 'Master of Diagonals',
        description: 'Win 3 games by getting three in a row diagonally (corner to corner)',
        icon: '🎯',
        condition: gameResult === 'win' && gameData?.winCondition === 'diagonal' && await this.checkDiagonalWins(userId, 3),
      },
      {
        type: 'speed_demon',
        name: 'Speed Demon',
        description: 'Win 20 total games to unlock the Christmas theme - keep playing!',
        icon: '⚡',
        condition: gameResult === 'win' && userStats.wins >= 20,
      },
      {
        type: 'veteran_player',
        name: 'Veteran Player',
        description: 'Play 100 total games (wins + losses + draws) to unlock the Summer theme',
        icon: '🎖️',
        condition: (userStats.wins + userStats.losses + userStats.draws) >= 100,
      },
      {
        type: 'comeback_king',
        name: 'Comeback King',
        description: 'Win a game after losing 5 games in a row - prove your resilience!',
        icon: '👑',
        condition: gameResult === 'win' && await this.checkComebackCondition(userId),
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

    // Check if friend request already exists
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.requesterId, requesterId),
        eq(friendRequests.requestedId, requestedId),
        eq(friendRequests.status, 'pending')
      ));

    if (existingRequest.length > 0) {
      throw new Error('Friend request already sent');
    }

    const [friendRequest] = await db
      .insert(friendRequests)
      .values({
        requesterId,
        requestedId,
      })
      .returning();
    
    return friendRequest;
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
    await db
      .delete(friendships)
      .where(or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
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
}

export const storage = new DatabaseStorage();
