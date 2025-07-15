import { db, collections } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { 
  IStorage,
  User,
  UpsertUser,
  Room,
  Game,
  Move,
  RoomParticipant,
  BlockedUser,
  InsertRoom,
  InsertGame,
  InsertMove,
  InsertRoomParticipant,
  InsertBlockedUser
} from './storage';

export class FirebaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection(collections.users).doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const userRef = db.collection(collections.users).doc(userData.id);
    const userDoc = await userRef.get();
    
    const now = Timestamp.now();
    const userDataWithTimestamp = {
      ...userData,
      updatedAt: now,
      ...(userDoc.exists ? {} : { createdAt: now })
    };
    
    await userRef.set(userDataWithTimestamp, { merge: true });
    
    const updatedDoc = await userRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
  }

  // Room operations
  async createRoom(roomData: InsertRoom & { ownerId: string }): Promise<Room> {
    const roomRef = db.collection(collections.rooms).doc();
    const now = Timestamp.now();
    
    const room = {
      ...roomData,
      id: roomRef.id,
      createdAt: now,
      updatedAt: now
    };
    
    await roomRef.set(room);
    return room as Room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const snapshot = await db.collection(collections.rooms)
      .where('code', '==', code)
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Room;
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const doc = await db.collection(collections.rooms).doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Room;
  }

  async updateRoomStatus(id: string, status: string): Promise<void> {
    await db.collection(collections.rooms).doc(id).update({
      status,
      updatedAt: Timestamp.now()
    });
  }

  // Game operations
  async createGame(gameData: InsertGame): Promise<Game> {
    const gameRef = db.collection(collections.games).doc();
    const now = Timestamp.now();
    
    const game = {
      ...gameData,
      id: gameRef.id,
      createdAt: now,
      updatedAt: now
    };
    
    await gameRef.set(game);
    return game as Game;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const doc = await db.collection(collections.games).doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Game;
  }

  async getActiveGameByRoomId(roomId: string): Promise<Game | undefined> {
    const snapshot = await db.collection(collections.games)
      .where('roomId', '==', roomId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Game;
  }

  async updateGameBoard(gameId: string, board: Record<string, string>): Promise<void> {
    await db.collection(collections.games).doc(gameId).update({
      board,
      updatedAt: Timestamp.now()
    });
  }

  async updateGameStatus(gameId: string, status: string, winnerId?: string, winCondition?: string): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (winnerId) updateData.winnerId = winnerId;
    if (winCondition) updateData.winCondition = winCondition;
    
    await db.collection(collections.games).doc(gameId).update(updateData);
  }

  async updateCurrentPlayer(gameId: string, currentPlayer: string): Promise<void> {
    await db.collection(collections.games).doc(gameId).update({
      currentPlayer,
      updatedAt: Timestamp.now()
    });
  }

  // Move operations
  async createMove(moveData: InsertMove): Promise<Move> {
    const moveRef = db.collection(collections.moves).doc();
    const now = Timestamp.now();
    
    const move = {
      ...moveData,
      id: moveRef.id,
      createdAt: now
    };
    
    await moveRef.set(move);
    return move as Move;
  }

  async getGameMoves(gameId: string): Promise<Move[]> {
    const snapshot = await db.collection(collections.moves)
      .where('gameId', '==', gameId)
      .orderBy('createdAt', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Move));
  }

  // Room participant operations
  async addRoomParticipant(participantData: InsertRoomParticipant): Promise<RoomParticipant> {
    const participantRef = db.collection(collections.roomParticipants).doc();
    const now = Timestamp.now();
    
    const participant = {
      ...participantData,
      id: participantRef.id,
      joinedAt: now
    };
    
    await participantRef.set(participant);
    return participant as RoomParticipant;
  }

  async getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]> {
    const snapshot = await db.collection(collections.roomParticipants)
      .where('roomId', '==', roomId)
      .get();
    
    const participants: (RoomParticipant & { user: User })[] = [];
    
    for (const doc of snapshot.docs) {
      const participant = { id: doc.id, ...doc.data() } as RoomParticipant;
      const user = await this.getUser(participant.userId);
      if (user) {
        participants.push({ ...participant, user });
      }
    }
    
    return participants;
  }

  async removeRoomParticipant(roomId: string, userId: string): Promise<void> {
    const snapshot = await db.collection(collections.roomParticipants)
      .where('roomId', '==', roomId)
      .where('userId', '==', userId)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  // Statistics operations
  async updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const userRef = db.collection(collections.users).doc(userId);
    const increment = FieldValue.increment(1);
    
    const updateData: any = { updatedAt: Timestamp.now() };
    
    if (result === 'win') updateData.wins = increment;
    else if (result === 'loss') updateData.losses = increment;
    else if (result === 'draw') updateData.draws = increment;
    
    await userRef.update(updateData);
  }

  async getUserStats(userId: string): Promise<{ wins: number; losses: number; draws: number }> {
    const user = await this.getUser(userId);
    return {
      wins: user?.wins || 0,
      losses: user?.losses || 0,
      draws: user?.draws || 0
    };
  }

  // Blocked users operations
  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    const blockRef = db.collection(collections.blockedUsers).doc();
    const now = Timestamp.now();
    
    const block = {
      id: blockRef.id,
      blockerId,
      blockedId,
      createdAt: now
    };
    
    await blockRef.set(block);
    return block as BlockedUser;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const snapshot = await db.collection(collections.blockedUsers)
      .where('blockerId', '==', blockerId)
      .where('blockedId', '==', blockedId)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const snapshot = await db.collection(collections.blockedUsers)
      .where('blockerId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlockedUser));
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const snapshot = await db.collection(collections.blockedUsers)
      .where('blockerId', '==', blockerId)
      .where('blockedId', '==', blockedId)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  }
}

export const firebaseStorage = new FirebaseStorage();