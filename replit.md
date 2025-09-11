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
- **AI Integration**: Google Gemini 2.5-Pro for video swing analysis
- **Error Handling**: Centralized error handling middleware

### Database Schema
- **Users Table**: Stores user authentication data (id, username, password)
- **Swing Analyses Table**: Stores analysis results with JSON fields for:
  - Swing phases with scores and feedback
  - Key metrics with performance indicators
  - Recommendations categorized by priority and impact
  - Added isSaved, clubId, and notes fields for saved analyses
- **Clubs Table**: Stores golf club information:
  - Club details (name, type, brand, model, loft, shaft)
  - Active status tracking for in-bag management
- **User Preferences Table**: Stores user settings:
  - Units preference (yards/meters)
  - Handicap
  - Default club selection
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Migrations**: Drizzle Kit for schema migrations

## Data Flow

1. **Video Upload**: Users upload golf swing videos through the frontend
2. **File Processing**: Backend receives and validates video files using Multer
3. **AI Analysis**: Videos are sent directly to Google Gemini 2.5-Pro for multimodal analysis
4. **Data Storage**: Analysis results are stored in PostgreSQL database
5. **Results Display**: Frontend fetches and displays detailed analysis results

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@google/genai**: Google Gemini API client for video analysis
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
- **AI Integration**: Requires `GEMINI_API_KEY` environment variable

### Key Architectural Decisions

1. **Monorepo Structure**: Chosen for code sharing between frontend and backend, with shared types and schemas
2. **In-Memory Storage Fallback**: MemStorage class provides development fallback when database is unavailable
3. **Mobile-First Design**: Golf applications benefit from mobile usage on the course
4. **AI-Powered Analysis**: Google Gemini 2.5-Pro provides sophisticated multimodal video swing analysis
5. **Type Safety**: Full TypeScript implementation ensures runtime safety and better developer experience
6. **Component-Based UI**: shadcn/ui provides accessible, customizable components with consistent design

## Recent Changes (January 2025)

### AI Provider Selection (Latest - January 2025)
- **Multiple AI Providers**: Added support for both Google Gemini and OpenAI ChatGPT-5 (GPT-4o)
- **Admin Configuration**: Admins can switch between AI providers in the admin settings
- **Provider Abstraction**: Created unified AI provider interface for seamless switching
- **Database Schema**: Added ai_settings table to store provider preferences
- **API Endpoints**: `/api/admin/ai-settings` for managing AI provider selection
- **UI Update**: Admin panel now includes provider selection dropdown with descriptions

## Recent Changes (January 2025)

### AR Swing Guidance Feature (Latest)
- **AR Overlay System**: Real-time camera-based swing guidance with position overlays
- **Live Analysis**: Real-time posture, alignment, and club position feedback
- **Interactive Guidelines**: Visual markers for head position, shoulder line, hip line, ball position, and target line
- **Practice Mode**: Standalone AR practice session without video recording
- **Mobile Camera Integration**: Uses device's back camera with proper mobile optimization
- **Confidence Scoring**: Real-time confidence percentage for swing setup analysis

### Major Feature Expansion
- **Save Analyses**: Added ability to save analyses to personal history with club assignment and notes
- **Club Management**: Full CRUD operations for managing golf clubs in user's bag
- **Progress Tracking**: Performance trends visualization with charts showing improvement over time
- **User Profiles**: Settings management and preferences (units, handicap)
- **Enhanced Navigation**: Bottom navigation bar with proper routing between pages
- **Replit Authentication**: Integrated Replit OpenID Connect for secure user authentication
- **Admin Role System**: Added admin functionality for dynamic AI prompt management

### New Pages Added
- `/history` - View saved swing analyses filtered by club
- `/progress` - Performance metrics and trends over time
- `/profile` - User settings and golf bag management
- `/admin` - Admin panel for managing AI prompts (admin users only)

### New API Endpoints
- `PATCH /api/swing-analyses/:id/save` - Save/unsave analysis
- `GET /api/swing-analyses/saved` - Get saved analyses
- `GET/POST/PATCH/DELETE /api/clubs` - Club management
- `GET/PUT /api/preferences` - User preferences
- `GET/POST/PATCH /api/admin/prompts` - Admin prompt management
- `POST /api/admin/prompts/:id/activate` - Activate specific prompt

### UI/UX Improvements
- Mobile-first responsive design with bottom navigation
- Save functionality with club selection and notes
- Club management with in-bag status tracking
- Performance charts using Recharts library
- Consistent golf-themed color scheme throughout
- Admin interface for dynamic prompt configuration
- GIF animations for swing phase visualization instead of static frames
- Full swing GIF preview in video player with click-to-play interaction
- Enhanced video quality settings: 720p GIFs with optimized palette, 20-24fps for smooth motion
- Golf metrics: Ball speed, estimated distance, launch angle, hang time, and curve analysis from AI

### Technical Updates
- **Database Schema**: Migrated to Replit Auth user model with proper session handling
- **Prompt Configuration**: AI prompts now stored in database and can be updated by admins
- **User Isolation**: Complete data isolation ensuring users only see their own data
- **Admin Role**: Admin users can dynamically update Gemini prompts for better analysis results