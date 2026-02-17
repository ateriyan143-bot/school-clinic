# Quick Setup Guide

## 🚀 Getting Started

### 1. Database Setup

**Option A: Using Nile (Recommended)**
1. Sign up at [https://console.thenile.dev](https://console.thenile.dev)
2. Create a new workspace and database
3. Copy the connection string
4. Update `server/.env`:
   ```
   DATABASE_URL=your-nile-connection-string
   DEFAULT_TENANT_ID=your-tenant-id
   ```
5. Run the schema in Nile console: Copy content from `database/schema.sql`

**Option B: Using Local PostgreSQL**
1. Install PostgreSQL
2. Create database: `createdb school_clinic`
3. Run schema: `psql school_clinic < database/schema.sql`
4. Update `server/.env` with your local connection

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm install  # Already done ✓
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install  # Already done ✓
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 4. Login

The demo uses simplified authentication. Any email/password will work for testing.

## 📝 Next Steps

1. Set up your database (Nile or PostgreSQL)
2. Run the schema from `database/schema.sql`
3. Optionally seed with test data from `database/seed.sql`
4. Start both servers
5. Login and explore!

## 🔧 Environment Variables

See `.env.example` files in `client/` and `server/` directories.

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.
