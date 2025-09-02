# TinyPNG Manager

## Overview

TinyPNG Manager is a web-based application that provides a management interface for image compression using the TinyPNG API. The application allows users to upload images, manage API keys, track compression history, and monitor usage statistics through a modern dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark theme
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with structured error handling
- **File Upload**: Multer middleware for handling multipart form data
- **Development**: Hot module replacement via Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Three main entities - users, API keys, and compression records
- **Migration**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless connection

### Database Schema Design
- **Users Table**: Basic user authentication with username/password
- **API Keys Table**: Manages TinyPNG API keys with usage tracking and monthly limits
- **Compressions Table**: Records all compression attempts with status tracking and file metadata

### API Integration Architecture
- **TinyPNG Service**: Centralized service layer for image compression operations
- **API Key Management**: Rotation system to distribute load across multiple API keys
- **Rate Limiting**: Monthly usage tracking per API key with automatic rotation
- **Error Handling**: Comprehensive error categorization for TinyPNG API responses

### Authentication & Session Management
- **Session Storage**: Connect-pg-simple for PostgreSQL-backed sessions
- **Security**: Express session middleware with secure cookie configuration
- **Authorization**: Route-level protection for authenticated endpoints

### File Processing Pipeline
- **Upload Flow**: Multer memory storage → validation → TinyPNG compression → result tracking
- **Image Validation**: MIME type checking and file size limits (5MB)
- **Compression Tracking**: Status progression from pending → processing → completed/failed
- **Storage Strategy**: In-memory processing without persistent file storage

### Development Environment
- **Hot Reloading**: Vite dev server with Express middleware integration
- **Path Aliases**: Configured TypeScript paths for clean imports
- **Error Overlay**: Runtime error modal for development debugging
- **Replit Integration**: Cartographer plugin for Replit environment

## External Dependencies

### Core Services
- **TinyPNG API**: Primary image compression service with API key management
- **Neon Database**: Serverless PostgreSQL hosting

### Frontend Libraries
- **Radix UI**: Comprehensive component primitives for accessible UI
- **TanStack React Query**: Server state synchronization and caching
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Backend Libraries
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Multer**: File upload handling middleware
- **TinyPNG Node.js SDK**: Official TinyPNG API client
- **Express Session**: Session management with PostgreSQL storage

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Production bundling for server code