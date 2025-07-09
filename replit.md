# Employee Status Management System

## Overview

This is a modern employee status management system built with React/TypeScript frontend and Express.js backend. The application is designed for Japanese businesses and features real-time presence status tracking, mobile status update functionality, and a large display view for office monitoring. The system focuses purely on status management without attendance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live status updates

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Real-time Communication**: WebSocket server for broadcasting updates
- **Session Management**: PostgreSQL-based session storage

### Build and Development
- **Module System**: ESM (ES Modules)
- **Development**: tsx for TypeScript execution
- **Production Build**: esbuild for server bundling, Vite for client

## Key Components

### Database Schema
- **Departments**: Company departments with Japanese names and icons
- **Employees**: Staff information with both English and Japanese names
- **Employee Status**: Real-time presence status (在席, 離席, 外出中, テレワーク, 休み) with 20-character comment field
- **Sessions**: Authentication session storage

### Real-time Features
- **WebSocket Integration**: Live updates for status changes and attendance
- **Geolocation Support**: Location tracking for mobile clock-in
- **Auto-refresh**: Periodic data updates for large display mode

### User Interface Views
- **Dashboard**: Main overview of all departments and employees
- **Mobile Status Update**: Dedicated mobile interface for status updates with comment support
- **Large Display**: Full-screen view optimized for office monitors
- **Status History**: Current status overview for all employees

## Data Flow

### Client-Server Communication
1. **REST API**: Standard CRUD operations for attendance and employee data
2. **WebSocket**: Real-time broadcasts for status updates
3. **Query Invalidation**: Automatic cache updates when data changes

### Status Management
1. Employee selects status (on-site, remote, direct-commute, etc.)
2. Status update sent to server with optional geolocation
3. Server broadcasts update to all connected clients
4. UI automatically refreshes to show current status

### Attendance Tracking
1. Employee uses mobile interface to clock in/out
2. Geolocation data captured if available
3. Attendance record created in database
4. Real-time notification sent to all clients

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **ws**: WebSocket implementation for real-time features

### Development Tools
- **drizzle-kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production builds

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **lucide-react**: Icon library

## Deployment Strategy

### Database Setup
- Uses Neon serverless PostgreSQL
- Schema defined in shared/schema.ts
- Migrations handled by Drizzle Kit
- Environment variable DATABASE_URL required

### Build Process
1. **Client Build**: Vite bundles React app to dist/public
2. **Server Build**: esbuild bundles Express app to dist/index.js
3. **Shared Code**: TypeScript types and schemas shared between client/server

### Production Configuration
- **Static Files**: Express serves built client files
- **API Routes**: RESTful endpoints under /api prefix
- **WebSocket**: Real-time connection on /ws path
- **Session Storage**: PostgreSQL-based sessions

### Environment Requirements
- Node.js with ESM support
- DATABASE_URL environment variable
- Production build creates self-contained dist directory

The application follows a monorepo structure with shared TypeScript types between client and server, ensuring type safety across the full stack. The real-time features make it suitable for office environments where immediate status updates are important.