# Backend Installation & Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Step 1: Install Dependencies

```bash
cd Backend
npm install
```

## Step 2: Setup PostgreSQL Database

### Option A: Using PostgreSQL CLI

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE neshiha_clinic;

# Verify database
\l

# Exit
\q
```

### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name: `neshiha_clinic`
5. Click "Save"

## Step 3: Configure Environment Variables

The `.env` file is already created with default values. **Update these values:**

```env
# Update your PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neshiha_clinic
DB_USER=postgres
DB_PASSWORD=your_password_here

# Keep other settings as is for development
```

## Step 4: Run Migrations

This will create all database tables:

```bash
npm run migrate
```

You should see:

```
✅ Database connection established successfully.
✅ Database synchronized successfully.
✅ Database migrations completed successfully
```

## Step 5: Seed Initial Data

This will create default users and sample data:

```bash
npm run seed
```

You should see:

```
✅ Super Admin created: admin@neshihaclinic.com
✅ Staff Manager created: manager@neshihaclinic.com
✅ Doctor created: doctor@neshihaclinic.com
✅ Data Clerk created: clerk@neshihaclinic.com
✅ Sample medicines created
✅ Default settings created
```

## Step 6: Start Development Server

```bash
npm run dev
```

You should see:

```
🚀 Server running in development mode on port 5000
📍 API Base URL: http://localhost:5000/api/v1
```

## Default Credentials

After seeding, you can login with these accounts:

### Super Admin

- Email: `admin@neshihaclinic.com`
- Password: `Admin@123`
- Access: Full system access

### Staff Manager

- Email: `manager@neshihaclinic.com`
- Password: `Manager@123`
- Access: Manage staff accounts

### Doctor

- Email: `doctor@neshihaclinic.com`
- Password: `Doctor@123`
- Access: Patient care, prescriptions, investigations

### Data Clerk

- Email: `clerk@neshihaclinic.com`
- Password: `Clerk@123`
- Access: Patient registration, visit creation

## Testing the API

### Health Check

```bash
curl http://localhost:5000/health
```

Response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neshihaclinic.com",
    "password": "Admin@123"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Profile (with token)

```bash
curl http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Database Connection Error

**Error:** `Unable to connect to the database`

**Solution:**

1. Check PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Services (Windows)
2. Verify database credentials in `.env`
3. Ensure database `neshiha_clinic` exists

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**

1. Change `PORT` in `.env` to another port (e.g., 5001)
2. Or kill the process using port 5000

### Migration Errors

**Error:** `Migration failed`

**Solution:**

1. Drop database and recreate: `DROP DATABASE neshiha_clinic; CREATE DATABASE neshiha_clinic;`
2. Run migrations again: `npm run migrate`

## API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Available Endpoints

#### Authentication

- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get profile
- `PUT /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Staff Management

- `GET /staff` - List all staff
- `GET /staff/:id` - Get staff details
- `POST /staff` - Create staff
- `PUT /staff/:id` - Update staff
- `DELETE /staff/:id` - Delete staff
- `PATCH /staff/:id/activate` - Activate staff
- `PATCH /staff/:id/deactivate` - Deactivate staff

#### Patient Management

- `GET /patients` - List all patients
- `GET /patients/:id` - Get patient details
- `POST /patients` - Register patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient
- `GET /patients/:id/history` - Get patient history
- `POST /patients/:id/photo` - Upload photo

#### Visit Management

- `GET /visits` - List all visits
- `GET /visits/:id` - Get visit details
- `POST /visits` - Create visit
- `PUT /visits/:id` - Update visit
- `PATCH /visits/:id/status` - Update status
- `GET /visits/queue` - Doctor queue
- `POST /visits/:id/vitals` - Record vital signs

#### Medicine Management

- `GET /medicines` - List all medicines
- `GET /medicines/:id` - Get medicine details
- `POST /medicines` - Create medicine
- `PUT /medicines/:id` - Update medicine
- `DELETE /medicines/:id` - Delete medicine
- `GET /medicines/low-stock` - Low stock medicines
- `GET /medicines/expired` - Expired medicines

#### Prescription Management

- `GET /prescriptions` - List prescriptions
- `GET /prescriptions/:id` - Get prescription
- `POST /prescriptions` - Create prescription
- `POST /prescriptions/:id/dispense` - Dispense medicine

#### Dashboard

- `GET /dashboard/admin` - Admin dashboard
- `GET /dashboard/doctor` - Doctor dashboard
- `GET /dashboard/clerk` - Clerk dashboard

#### Reports

- `GET /reports/patients` - Patient report
- `GET /reports/visits` - Visit report
- `GET /reports/medicines` - Medicine report
- `GET /reports/daily` - Daily report
- `GET /reports/monthly` - Monthly report
- `GET /reports/yearly` - Yearly report

## Next Steps

1. ✅ Backend is complete and running
2. 🔄 Now proceed to Frontend integration
3. 🔄 Connect Frontend to Backend APIs
4. 🔄 Implement all UI components

## Production Deployment

Before deploying to production:

1. Change all secrets in `.env`:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SESSION_SECRET`

2. Set `NODE_ENV=production`

3. Configure production database

4. Set up HTTPS

5. Configure CORS for production frontend URL

6. Set up proper logging and monitoring

7. Enable rate limiting

8. Set up database backups
