# SwingAI Golf Analysis App

## Overview

SwingAI is a golf swing analysis application that uses AI to provide detailed feedback on golf swings. Users can upload video files of their golf swings, which are then analyzed using OpenAI's GPT-4o model to provide comprehensive feedback including scores, recommendations, and detailed analysis of different swing phases.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, all organized in a monorepo structure.

### Directory Structure
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript types and schemas
- `/migrations` - Database migration files

## Key Components

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for build tooling
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom golf-themed color scheme
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful API endpoints for swing analysis operations
- **File Upload**: Multer middleware for handling video file uploads (MP4, MOV, AVI)
- **AI Integration**: OpenAI GPT-4o for swing analysis
- **Error Handling**: Centralized error handling middleware

### Database Schema
- **Users Table**: Stores user authentication data (id, username, password)
- **Swing Analyses Table**: Stores analysis results with JSON fields for:
  - Swing phases with scores and feedback
  - Key metrics with performance indicators
  - Recommendations categorized by priority and impact
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migrations**: Drizzle Kit for schema migrations

## Data Flow

1. **Video Upload**: Users upload golf swing videos through the frontend
2. **File Processing**: Backend receives and validates video files using Multer
3. **AI Analysis**: Videos are converted to base64 and sent to OpenAI GPT-4o for analysis
4. **Data Storage**: Analysis results are stored in PostgreSQL database
5. **Results Display**: Frontend fetches and displays detailed analysis results

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **openai**: OpenAI API client for GPT-4o integration
- **multer**: File upload handling
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Accessible UI component primitives

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `/dist/public`
- **Backend**: esbuild bundles Express server to `/dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution
- **Production**: Runs compiled JavaScript bundle
- **Database**: Requires `DATABASE_URL` environment variable
- **AI Integration**: Requires `OPENAI_API_KEY` environment variable

### Key Architectural Decisions

1. **Monorepo Structure**: Chosen for code sharing between frontend and backend, with shared types and schemas
2. **In-Memory Storage Fallback**: MemStorage class provides development fallback when database is unavailable
3. **Mobile-First Design**: Golf applications benefit from mobile usage on the course
4. **AI-Powered Analysis**: GPT-4o provides sophisticated swing analysis beyond basic computer vision
5. **Type Safety**: Full TypeScript implementation ensures runtime safety and better developer experience
6. **Component-Based UI**: shadcn/ui provides accessible, customizable components with consistent design