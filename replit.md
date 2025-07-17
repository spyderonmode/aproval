# TicTac 3x5 Game

## Overview

This is a full-stack web application for a strategic Tic-Tac-Toe game played on a unique 3x5 grid. The application features multiple game modes (AI, pass-and-play, and online multiplayer), real-time gameplay through WebSockets, and a modern React frontend with a Node.js/Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Reset Game Feature Removal** (July 17, 2025): Removed "Reset Game" button from online multiplayer games per user request, keeping it only available in AI and pass-and-play modes to prevent disruption of online gameplay between players.
- **Achievement Badge UI Fix** (July 17, 2025): Fixed UI layout issue where achievement badges were overlapping Profile and Chat buttons in Online Players modal. Reorganized layout to separate achievement badges into their own row below user information, ensuring buttons remain fully accessible while maintaining clean visual hierarchy.
- **Matchmaking Synchronization Fix** (July 17, 2025): Fixed critical matchmaking bug where one player would start a room while the other remained in matchmaking queue. Root cause was duplicate WebSocket message handling and multiple room join attempts. Fixed by adding duplicate detection for match_found/matchmaking_response messages, preventing duplicate room joins through state tracking, and clearing room state on WebSocket reconnect to ensure clean matchmaking flow.
- **Theme API & Emoji Broadcasting Fixes** (July 17, 2025): Fixed special theme fetching errors by adding robust error handling for theme API calls, ensuring themes load properly even when database queries fail. Enhanced emoji reaction WebSocket broadcasting with better logging and validation, fixing issue where second emoji reactions weren't visible to other players in online games.
- **Matchmaking Auto-Start Fix** (July 16, 2025): Fixed matchmaking synchronization issue where matched players were placed in rooms but games weren't automatically started. Added auto-game creation logic that triggers 2 seconds after successful matchmaking, ensuring both players get a seamless experience from matchmaking queue to active gameplay. Eliminated duplicate WebSocket message handlers that were causing client-side warnings.
- **Achievement Badge UI Improvements** (July 16, 2025): Removed yellow circle background from achievement badges in game board for cleaner appearance, changed to simple text styling with proper theme support. Game board now shows only the latest achievement badge earned by each player instead of first victory badge. Enhanced WebSocket synchronization with better state management and forced re-renders to fix React sync issues between players. Removed date logic from achievement tooltips and displays throughout the application.
- **Complete Achievement System with Seasonal Themes** (July 16, 2025): Implemented comprehensive achievement system with 7 different badges (First Win, Win Streak Master, Master of Diagonals, Speed Demon, Veteran Player, Comeback King, True Champion) that unlock automatically when players reach specific milestones. Added seasonal themes (Halloween, Christmas, Summer) that unlock through achievements - Win Streak Master unlocks Halloween theme, Speed Demon unlocks Christmas theme, and Veteran Player unlocks Summer theme. Created database schema with achievements and user_themes tables, built beautiful achievement modal with locked/unlocked states, enhanced theme selector to show locked themes, and integrated achievement button into header sidebar. Fixed matchmaking synchronization issue where players received different message types causing inconsistent room joining behavior.
- **JSON to Neon Database Sync** (July 15, 2025): Added comprehensive user synchronization between JSON file storage and Neon database. System now automatically syncs all existing JSON users to the database on server startup, ensuring complete data consistency. Added manual sync endpoint for admin users to trigger sync on demand. All user operations (registration, login, profile updates) now maintain dual storage for compatibility
- **Email Service Migration to SMTP** (July 15, 2025): Removed SendGrid dependency and migrated to pure nodemailer SMTP configuration for email verification and password reset functionality. System now uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL environment variables for email service configuration. Added enhanced logging for email service initialization and sending status to help with debugging
- **Play Again Feature Fix** (July 15, 2025): Fixed critical bug where "Play Again" button wasn't working in online multiplayer mode - root cause was old finished game objects being reused instead of creating fresh game states. Fixed by clearing current game state before creating new game, ensuring fresh game objects with active status, empty board, and proper player assignments. Enhanced WebSocket game_started handling to force complete state reset and prevent stale game data
- **Interactive Emoji Reaction System** (July 15, 2025): Implemented player-controlled emoji reactions during gameplay with 12 different emojis (😂, ❤️, 😮, 😠, 😢, 😎, 🔥, 👍, 👎, 🤔, 🎉, 🎯). Players can click the "React" button to open emoji panel and express emotions actively during games. Reactions appear next to player profiles with smooth animations and auto-fade after 3-4 seconds. Works in all game modes (AI, pass-and-play, online) with proper player identification. Added EmojiReactionPanel component for organized emoji selection with enhanced hover animations including scale, rotation, and continuous glow effects
- **Dynamic Player Ranking Visualization** (July 15, 2025): Implemented comprehensive ranking visualization system with three interactive view modes - List view with animated ranking changes and streak indicators, Chart view with win rate distribution and games played visualizations, and Stats view with overview metrics including total players, average win rate, most active player, and top streaks. Added real-time rank change tracking, animated transitions, and enhanced visual feedback for player performance
- **Critical Move Disappearing Bug Fix** (July 15, 2025): Fixed major bug where moves disappeared after 1 second in all game modes - root cause was GameBoard component being remounted due to timestamp-based key prop, causing React to lose all internal state. Fixed by removing timestamp from component key and optimizing board state persistence for both local and online games
- **Online Game Synchronization Fix** (July 15, 2025): Enhanced WebSocket board synchronization for online multiplayer games by adding proper useEffect dependencies for board state, currentPlayer, and timestamp changes, ensuring real-time move updates appear immediately for both players
- **Database Migration to Personal Neon Account** (July 15, 2025): Successfully migrated from Replit-managed Neon database to user's own Neon account for full database ownership and portability - migrated 3 users, 10 rooms, 10 games, 17 participants, and 50 moves with zero data loss, ensuring complete database control and deployment flexibility
- **Header Menu System** (July 15, 2025): Replaced logout button with hamburger menu dropdown in header containing theme selector, online players, profile settings, and logout - improved mobile experience with organized dropdown menu accessible from header while maintaining clean navigation
- **Header Mobile Optimization** (July 15, 2025): Moved theme selector and online players button from crowded header to organized Settings card in sidebar - improved mobile responsiveness and cleaner navigation with dedicated settings section containing theme customization and player count display
- **Block User Feature** (July 15, 2025): Added comprehensive user blocking system in chat - users can block/unblock other players, blocked users are visually indicated with red badges, messages from blocked users are automatically filtered out, chat input is disabled for blocked users, and blocked users have limited chat functionality while still appearing in online users list with unblock option
- **Autumn Theme Addition** (July 15, 2025): Replaced Aurora theme with smooth Autumn theme featuring warm orange and amber colors, subtle gradients, and gentle transitions - designed to be easy on the eyes with no distracting animations or bright effects
- **Custom Theme System** (July 15, 2025): Added comprehensive theme system with 6 visual styles (Default, Neon, Autumn, Minimalist, Nature, Space) - players can customize game board appearance, colors, and styling through theme selector in header. Themes persist in localStorage and dynamically update all game components including cells, player indicators, and UI elements
- **Chat System Removed from Game Board** (July 15, 2025): Removed in-game chat functionality from the game board component to keep the gaming experience focused and clean. Chat functionality remains available in the main lobby through the Online Players modal
- **Unread Message Indicator** (July 15, 2025): Added red circular badge on Chat buttons showing number of unread messages, with automatic clearing when starting a conversation and proper cleanup when users go offline
- **Real-time Chat System** (July 15, 2025): Replaced invitation system with comprehensive chat functionality - players can now message each other in real-time through the Online Players modal, with proper message display, WebSocket integration, and custom event handling for seamless communication
- **Header Display Fix** (July 15, 2025): Fixed duplicate player name display in the header by removing redundant user name element, ensuring clean single display of player information
- **Profile Update Session Fix** (July 15, 2025): Fixed issue where users were getting logged out after updating their profile (display name/profile picture). Updated profile endpoint to sync changes to both JSON file and database, and properly maintain session data to keep users logged in after profile updates
- **Complete Matchmaking System** (July 15, 2025): Implemented full matchmaking system with Quick Match button, real-time search modal with timer and progress bar, automatic player pairing when 2 players search, WebSocket-based match notifications, and automatic room creation for matched players
- **Email/Username Login & Production URLs** (July 15, 2025): Updated login system to support both username and email authentication, modified email verification and password reset URLs to use production domain (tic-tac-master-zanv1.replit.app) instead of localhost
- **Forgot Password System** (July 15, 2025): Added complete forgot password functionality with password reset endpoints, email templates for password reset, forgot password modal in auth page, dedicated reset password page, secure token-based reset system with 1-hour expiry, and SMTP email integration for password reset emails
- **Mandatory Email Verification** (July 15, 2025): Implemented mandatory email verification system requiring users to verify their email before accessing the application, added email verification endpoints and resend functionality, created email verification modal and dedicated verification page, updated authentication flow to block unverified users, and integrated SMTP email service for verification emails
- **Animated Borders & Spectator Limit** (July 15, 2025): Added animated pulsing borders to occupied cells using framer-motion with alternating colors based on player (blue for X, red for O), increased spectator limit from default to 50 users per room for better viewing capacity, enhanced visual feedback for active game cells with smooth border animations
- **Profile Picture Display Fix** (July 15, 2025): Fixed profile picture display in game over modal by supporting both profilePicture and profileImageUrl fields for maximum compatibility between authentication systems and database schema
- **Room Leave Notifications & UI Improvements** (July 15, 2025): Fixed main menu button to properly trigger room end notifications when clicked, improved winning box animation with smooth color transitions and scaling effects, removed crown icon from game over popup for cleaner design, fixed player name and profile picture display to show actual player info only in online multiplayer games, enhanced WebSocket leave_room handling to notify remaining players when someone clicks main menu
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