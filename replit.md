# TicTac 3x5 Game

## Overview

This is a full-stack web application for a strategic Tic-Tac-Toe game played on a unique 3x5 grid. The application features multiple game modes (AI, pass-and-play, and online multiplayer), real-time gameplay through WebSockets, and a modern React frontend with a Node.js/Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **JSON Authentication System** (July 14, 2025): Replaced Google/Firebase authentication with simple JSON-based login/register system
- **Local Game Initialization**: Fixed "game not active" error by implementing automatic game initialization for AI and pass-play modes
- **Simplified User Interface**: Updated UI to display username instead of Google profile information
- **Password Security**: Added password hashing using Node.js crypto module for secure authentication
- **Session Management**: Implemented Express sessions for secure user authentication

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Components**: Radix UI components with custom styling via shadcn/ui
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Real-time Communication**: WebSockets for live game updates
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Relational design with users, rooms, games, moves, and room participants tables
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Game Engine
- **Custom Game Logic**: Implements complete 3x5 grid Tic-Tac-Toe (positions 1-15) with diagonal-only winning conditions
- **AI Player**: Multi-difficulty AI with random, medium (strategic), and hard (minimax-like) modes optimized for diagonal patterns
- **Move Validation**: Server-side validation for all game moves
- **Game State Management**: Real-time synchronization between clients

### Authentication System
- **Replit Auth Integration**: OAuth2/OpenID Connect flow
- **Session Management**: Secure server-side sessions with PostgreSQL storage
- **User Management**: Automatic user creation and profile management

### Real-time Features
- **WebSocket Server**: Handles real-time game updates and room management
- **Connection Management**: Tracks user connections and room memberships
- **Message Broadcasting**: Sends game updates to relevant room participants

### Room and Game Management
- **Room System**: Private and public rooms with unique codes
- **Game Modes**: Support for AI, pass-and-play, and online multiplayer
- **Spectator Support**: Users can watch ongoing games
- **Player Statistics**: Win/loss/draw tracking

## Data Flow

1. **Authentication**: Users authenticate via Replit Auth, creating sessions in PostgreSQL
2. **Room Creation/Joining**: Users create or join rooms using unique codes
3. **Game Initialization**: Games are created when players are ready, initializing board state
4. **Move Processing**: Client moves are validated server-side, then broadcast to all room participants
5. **Game Resolution**: Win/draw conditions are checked server-side, updating user statistics
6. **Real-time Updates**: All game state changes are pushed to connected clients via WebSocket

## External Dependencies

### Authentication
- **Replit Auth**: OAuth2 provider for user authentication
- **OpenID Connect**: Standard protocol for identity verification

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Efficient database connection management

### UI and Styling
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Instant updates during development
- **Environment Variables**: Secure configuration management

### Production Build
- **Frontend**: Vite builds optimized React application to static files
- **Backend**: esbuild bundles Express server for production
- **Static Assets**: Frontend served from Express server

### Database Management
- **Schema Migrations**: Drizzle Kit handles database schema changes
- **Environment Configuration**: DATABASE_URL for connection management
- **Session Storage**: PostgreSQL-backed session management

### Replit Integration
- **Replit-specific Features**: Development banner and cartographer for debugging
- **Environment Detection**: Automatic Replit environment detection
- **WebSocket Support**: Native WebSocket support in Replit environment

The application is designed to be deployed on Replit with minimal configuration, utilizing Replit's built-in database provisioning and authentication services while maintaining the flexibility to deploy elsewhere with environment variable changes.