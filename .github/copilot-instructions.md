# School Clinic Management System - Copilot Instructions

## Project Overview
Multi-tenant School Clinic Management System for nurses and administrators to manage student health profiles and clinic visit logs.

## Tech Stack
- Frontend: React.js + Vite + Tailwind CSS + React Router
- Backend: Node.js + Express
- Database: Nile (Serverless Postgres with tenant isolation)
- Authentication: Nile's built-in tenant-aware auth
- ORM: pg (node-postgres)

## Project Structure
- `/client` - React frontend application
- `/server` - Express backend API
- `/database` - SQL schema and migration files

## Development Status
- [x] Create copilot-instructions.md file
- [x] Scaffold project structure (client & server)
- [x] Set up database schema and SQL files
- [x] Create React frontend with components
- [x] Create Express backend with API routes
- [x] Install dependencies and configure
- [x] Create documentation (README)

## ✅ Setup Complete!

### What's Been Created:

**Frontend (React + Vite + Tailwind)**
- Login page with authentication
- Dashboard with stats and student list
- Add Student form
- Student Profile with visit history
- Reusable components (Sidebar, StatsCard, StudentTable, RecordVisitModal)
- Auth context for user management
- Responsive design matching mockups

**Backend (Node.js + Express + PostgreSQL)**
- Authentication routes
- Students CRUD API
- Clinic visits API
- Analytics endpoints
- Multi-tenant support via tenant_id
- CORS and security middleware

**Database**
- Schema with students and clinic_visits tables
- Indexes for performance
- Sample seed data
- Multi-tenant architecture

### 📋 To Run the Application:

1. **Setup Database** (Choose one):
   - Option A: Use Nile (see SETUP.md)
   - Option B: Local PostgreSQL (see SETUP.md)

2. **Start Backend**:
   ```bash
   cd server
   npm run dev
   ```

3. **Start Frontend** (new terminal):
   ```bash
   cd client
   npm run dev
   ```

4. **Access**: http://localhost:5173

### 📁 Project Files:
- `/client` - React frontend (138 packages installed ✓)
- `/server` - Express backend (86 packages installed ✓)
- `/database` - SQL schema and seed data
- `README.md` - Complete documentation
- `SETUP.md` - Quick start guide

## Key Features
1. Multi-tenant isolation using Nile's tenant_id
2. Student profile management (CRUD)
3. Clinic visit recording with vital signs
4. Dashboard analytics and statistics
5. Tenant-aware authentication

## Database Tables
- `students` - Student biographical and academic data
- `clinic_visits` - Medical visit logs with vitals and assessments
