// Firebase schema types - TypeScript interfaces for Firestore documents
import { z } from "zod";

// User document structure for Firebase
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  wins?: number;
  losses?: number;
  draws?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Room document structure
export interface Room {
  id: string;
  code: string;
  name: string;
  maxPlayers: number;
  isPrivate: boolean;
  ownerId: string;
  status: string; // waiting, playing, finished
  createdAt?: Date;
  updatedAt?: Date;
}

// Game document structure
export interface Game {
  id: string;
  roomId: string;
  playerXId: string;
  playerOId?: string;
  board: Record<string, string>;
  currentPlayer: string;
  status: string; // active, finished
  winnerId?: string;
  winCondition?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Move document structure
export interface Move {
  id: string;
  gameId: string;
  playerId: string;
  position: number;
  symbol: string;
  createdAt?: Date;
}

// Room participant document structure
export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: string; // player, spectator
  joinedAt?: Date;
  user?: User; // populated when needed
}

// Blocked user document structure
export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt?: Date;
}

// Insert schemas using Zod for validation
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  wins: z.number().default(0),
  losses: z.number().default(0),
  draws: z.number().default(0),
});

export const insertRoomSchema = z.object({
  code: z.string().min(4).max(8),
  name: z.string().min(1),
  maxPlayers: z.number().min(2).max(10).default(2),
  isPrivate: z.boolean().default(false),
  status: z.string().default("waiting"),
});

export const insertGameSchema = z.object({
  roomId: z.string(),
  playerXId: z.string(),
  playerOId: z.string().optional(),
  board: z.record(z.string()).default({}),
  currentPlayer: z.string(),
  status: z.string().default("active"),
  winnerId: z.string().optional(),
  winCondition: z.string().optional(),
});

export const insertMoveSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  position: z.number().min(1).max(15),
  symbol: z.string().length(1),
});

export const insertRoomParticipantSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  role: z.string().default("player"),
});

export const insertBlockedUserSchema = z.object({
  blockerId: z.string(),
  blockedId: z.string(),
});

// Type inference for inserts
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertMove = z.infer<typeof insertMoveSchema>;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;