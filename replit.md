# TicTac 3x5 Game

## Overview

This is a full-stack web application for a strategic Tic-Tac-Toe game played on a unique 3x5 grid. The application features multiple game modes (AI, pass-and-play, and online multiplayer), real-time gameplay through WebSockets, and a modern React frontend with a Node.js/Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Major Performance & UX Improvements** (July 15, 2025): Removed all framer-motion animations for instant move display, optimized WebSocket move broadcasting speed by removing extensive logging, implemented proper room leaving notifications when players click main menu, added 2-3 second winning position animation delay for all game modes, fixed white screen issues in AI and pass-play modes with proper game initialization and forced re-initialization when user becomes available, added spectator notifications for room events, enhanced game over flow with winning position highlighting before popup display, added AI difficulty selection (Easy, Medium, Hard) with different strategic behaviors and visual indicators
- **Critical UI & Audio Fixes** (July 14, 2025): Fixed spectator player name display by sending player info with WebSocket messages, resolved white screen popup issue with proper modal styling, improved move sound timing with delay for better real-time feedback, enhanced spectator game state handling to show complete player information on game board
- **Spectator WebSocket Fix & Enhanced Game Over** (July 14, 2025): Fixed spectator move visibility by adding roomId to WebSocket messages and improved spectator game state handling, removed creepy vibrating sound from Web Audio API oscillator, enhanced winning popup with profile pictures, crown icons, celebration effects, proper name display, and celebration sounds, removed reset game logic entirely
- **Critical Game Sync Fix** (July 14, 2025): Fixed the root cause of game board not updating after moves - moved WebSocket message handling from GameBoard to Home component to prevent double handling and state conflicts, added direct game state updates for move messages to ensure immediate board synchronization
- **Board Refresh and Spectator Fixes** (July 14, 2025): Fixed board refresh issue with force re-rendering and better WebSocket synchronization, fixed spectator room joining by correcting capacity logic to allow spectators when room supports them, added separate join buttons for players vs spectators
- **Authentication and Matchmaking Fixes** (July 14, 2025): Fixed login redirect to use "/" instead of "/home" to prevent 403 errors, removed find matching logic keeping only create room and join room functionality, enhanced game state synchronization to fix repeated start game clicking issue
- **Player Display Enhancement** (July 14, 2025): Added player names and profile pictures to the game board, showing actual player information instead of generic "Player X/O" labels
- **Game Start Broadcasting** (July 14, 2025): Enhanced game start broadcast to notify both players when game begins, ensuring both players see the same game state and move to the game board simultaneously
- **Table Rendering Fixes** (July 14, 2025): Fixed board rendering issues with comprehensive debugging, forced re-renders, and improved WebSocket message handling to ensure moves appear properly on both devices
- **Room Creator Permission Control** (July 14, 2025): Fixed room permissions so only the room creator can start games - other players see "Wait for Start" button and must wait for room owner to begin the game
- **Login Redirect Fix** (July 14, 2025): Fixed authentication redirect to send users to their dashboard (/home) instead of homepage (/) after successful login
- **Critical Game Creation Issue Fixed** (July 14, 2025): Fixed root cause of multiplayer board not updating - both users were creating separate games instead of sharing the same game. Added check to prevent duplicate game creation for same room, ensuring both players interact with the same game instance.
- **Game Creation Schema Fix** (July 14, 2025): Fixed game creation failure caused by null playerOId values - updated schema validation to properly handle optional fields and prevent null values from breaking validation
- **Room Join Logic Fix** (July 14, 2025): Fixed "room is full" error by checking if user is already in room before validating player count, preventing room owners from being blocked from their own rooms
- **Login Redirect Enhancement** (July 14, 2025): Fixed authentication flow to properly redirect users to home page after successful login without requiring manual page refresh
- **Online Matchmaking System** (July 14, 2025): Implemented real-time matchmaking queue for online multiplayer - users click "Find Match" and get automatically paired with other players waiting for matches. Fixed WebSocket connections and restored create room/spectator features alongside matchmaking.
- **Player Display Enhancement** (July 14, 2025): Added player names and profile pictures to the game board, showing actual player information instead of generic "Player X/O" labels
- **Enhanced Winning Line Animation** (July 14, 2025): Upgraded winning line effects with gradients, glow effects, and sparkle animations for better visual feedback
- **SMTP Email Verification** (July 14, 2025): Replaced SendGrid with configurable SMTP email system for account verification, made email verification optional during registration
- **Database Schema Fixes** (July 14, 2025): Fixed database foreign key constraints and removed problematic email verification columns causing user creation errors
- **Room Creation Fixes** (July 14, 2025): Fixed room creation failures by ensuring proper user synchronization between JSON auth and database
- **Audio System Integration** (July 14, 2025): Added comprehensive audio system with sound effects for moves, wins/losses, and UI interactions, plus background music toggle and volume control
- **Diagonal Win Restriction Fix** (July 14, 2025): Fixed diagonal win logic to properly exclude positions 5, 10, 15 from diagonal win patterns with additional validation
- **Enhanced Game Rules Display** (July 14, 2025): Updated both home page and landing page with detailed game rules including valid diagonal patterns and restrictions
- **Updated Game Rules** (July 14, 2025): Changed winning conditions to horizontal (4 in a row), vertical (3 in a column), and diagonal (3 in diagonal, excluding columns 5, 10, 15)
- **Profile Management System**: Added ability for users to upload profile pictures and set display names
- **Enhanced Authentication**: Extended user data to include displayName and profilePicture fields
- **JSON Authentication System**: Replaced Google/Firebase authentication with simple JSON-based login/register system
- **Local Game Initialization**: Fixed "game not active" error by implementing automatic game initialization for AI and pass-play modes
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