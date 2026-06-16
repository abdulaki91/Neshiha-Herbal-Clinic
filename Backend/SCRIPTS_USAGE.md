# Backend Scripts Usage Guide

## Running Scripts

All scripts can now be run from **any directory** thanks to the fixed `.env` path resolution.

### Recommended: Using NPM Scripts (from Backend root)

```bash
cd Backend

# Start development server
npm run dev

# Run database migration (creates/updates tables)
npm run migrate

# Drop all tables
npm run migrate undo

# Seed database with test data
npm run seed
```

### Alternative: Direct Execution

You can also run scripts directly from their directory:

```bash
# From Backend/src/scripts/
cd Backend/src/scripts
node seed.js
node migrate.js

# Or from anywhere with full path
node "d:\Web App\Neshiha-Herbal-Clinic\Backend\src\scripts\seed.js"
```

## Development Server (`npm run dev`)

**What it does:**

- ✅ Tests database connection
- ✅ Initializes Socket.io for real-time features
- ✅ Starts Express server on port 5000
- ✅ Auto-restarts on file changes (nodemon)

**What it does NOT do:**

- ❌ No automatic database migration
- ❌ No automatic seeding
- ❌ No schema syncing

**Clean Output:**

```
⏳ Connecting to database...
✅ Database connected successfully
✅ Socket.io initialized

🎉 ===============================================
🚀 Server running on http://localhost:5000
📍 API: http://localhost:5000/api/v1
🔌 Socket.io: Real-time enabled
📊 Environment: development
🎉 ===============================================
```

## Migration Script (`npm run migrate`)

**What it does:**

- Drops all existing tables (CASCADE)
- Recreates schema from scratch
- Creates all tables based on models
- Sets up foreign key relationships

**When to use:**

- Initial database setup
- After model changes
- To reset database structure

**Output:**

```
🗑️  Dropping existing tables...
✅ Schema reset successfully.
✅ Database synchronized successfully.
✅ Database migrations completed successfully
```

**Undo migration:**

```bash
npm run migrate undo
```

## Seed Script (`npm run seed`)

**What it does:**

- Creates test user accounts (4 roles)
- Creates sample medicines (3 items)
- Creates default clinic settings

**Test Accounts Created:**
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@neshihaclinic.com | Admin@123 |
| Staff Manager | manager@neshihaclinic.com | Manager@123 |
| Doctor | doctor@neshihaclinic.com | Doctor@123 |
| Data Clerk | clerk@neshihaclinic.com | Clerk@123 |

**When to use:**

- After fresh migration
- To reset test data
- Initial setup

**Note:** Script is idempotent - it won't create duplicates if data already exists.

## Typical Workflow

### First Time Setup

```bash
cd Backend
npm install           # Install dependencies
npm run migrate       # Create database tables
npm run seed          # Add test data
npm run dev          # Start server
```

### Daily Development

```bash
cd Backend
npm run dev          # Just start the server
```

### Reset Database

```bash
cd Backend
npm run migrate      # Drop and recreate tables
npm run seed         # Re-add test data
```

### Make Model Changes

```bash
# 1. Edit model files in src/models/
# 2. Run migration to update database
npm run migrate
# 3. Optionally re-seed if needed
npm run seed
```

## Environment Variables

All scripts read from `Backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abdulaki_nashiha_clinic
DB_USER=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres

# Server Configuration
PORT=5000
NODE_ENV=development
API_VERSION=v1

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

# Security
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=15
```

## Troubleshooting

### "Unable to connect to the database"

**Check:**

1. PostgreSQL is running
2. Database exists: `abdulaki_nashiha_clinic`
3. Credentials in `.env` are correct
4. Port 5432 is not blocked

**Verify connection:**

```bash
psql -h localhost -U postgres -d abdulaki_nashiha_clinic
```

### "Table already exists" error

**Solution:**

```bash
npm run migrate undo
npm run migrate
```

### Seed data already exists

**This is normal!** The seed script checks if data exists and skips creation. To force re-seed:

```bash
npm run migrate      # Drops tables
npm run seed         # Fresh seed
```

## Notes

- All scripts use ES modules (import/export)
- Scripts automatically find `.env` from Backend root
- Migration drops and recreates tables (data loss!)
- Seed script is safe to run multiple times
- Server does NOT auto-migrate on startup
