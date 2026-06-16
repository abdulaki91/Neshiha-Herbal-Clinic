# Neshiha Herbal Clinic - Backend API

Complete Clinic Management System Backend built with Node.js, Express, Sequelize, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator, Joi
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **File Upload**: Multer
- **Logging**: Winston, Morgan
- **Email**: Nodemailer

## Features

- ✅ JWT Authentication with Refresh Tokens
- ✅ Role-Based Access Control (RBAC)
- ✅ Complete Patient Management
- ✅ Visit Tracking System
- ✅ Medicine Inventory Management
- ✅ Prescription & Dispensing System
- ✅ Staff Management
- ✅ Dashboard Analytics
- ✅ Comprehensive Reports
- ✅ Audit Logging
- ✅ File Upload (Patient Photos)
- ✅ Email Notifications
- ✅ Rate Limiting & Security

## Roles & Permissions

### Super Admin

- Full system access
- Manage all staff
- View all reports
- System settings

### Staff Manager

- Create & manage staff (Doctors, Data Clerks)
- View staff reports
- Cannot manage patients

### Data Clerk

- Register patients
- Create visits
- Upload patient photos
- Cannot diagnose or prescribe

### Doctor

- View waiting patients
- Diagnose & prescribe
- Dispense medicine
- View complete patient history
- Manage laboratory requests

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

4. Update database credentials in `.env`

5. Create PostgreSQL database:

   ```sql
   CREATE DATABASE neshiha_clinic;
   ```

6. Run migrations:

   ```bash
   npm run migrate
   ```

7. Seed initial data (optional):

   ```bash
   npm run seed
   ```

8. Start the server:
   ```bash
   npm run dev
   ```

## API Documentation

Base URL: `http://localhost:5000/api/v1`

### Authentication

- `POST /auth/register` - Register new user (Super Admin only)
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `PUT /auth/change-password` - Change password (authenticated)
- `GET /auth/profile` - Get current user profile

### Staff Management

- `GET /staff` - List all staff
- `GET /staff/:id` - Get staff details
- `POST /staff` - Create staff (Super Admin, Staff Manager)
- `PUT /staff/:id` - Update staff
- `DELETE /staff/:id` - Delete staff (Super Admin only)
- `PATCH /staff/:id/activate` - Activate staff
- `PATCH /staff/:id/deactivate` - Deactivate staff

### Patient Management

- `GET /patients` - List all patients
- `GET /patients/:id` - Get patient details
- `POST /patients` - Register patient (Data Clerk)
- `PUT /patients/:id` - Update patient
- `GET /patients/:id/history` - Complete medical history
- `GET /patients/:id/visits` - Patient visits
- `GET /patients/:id/medicines` - Medicine history
- `POST /patients/:id/photo` - Upload patient photo

### Visit Management

- `GET /visits` - List visits
- `GET /visits/:id` - Get visit details
- `POST /visits` - Create visit (Data Clerk)
- `PUT /visits/:id` - Update visit
- `PATCH /visits/:id/status` - Update visit status
- `GET /visits/queue` - Doctor queue
- `POST /visits/:id/vitals` - Record vital signs
- `POST /visits/:id/diagnosis` - Add diagnosis
- `POST /visits/:id/investigation` - Add investigation

### Medicine Management

- `GET /medicines` - List medicines
- `GET /medicines/:id` - Get medicine details
- `POST /medicines` - Add medicine (Super Admin)
- `PUT /medicines/:id` - Update medicine
- `DELETE /medicines/:id` - Delete medicine
- `GET /medicines/low-stock` - Low stock alerts
- `GET /medicines/expired` - Expired medicines

### Prescription Management

- `GET /prescriptions` - List prescriptions
- `GET /prescriptions/:id` - Get prescription details
- `POST /prescriptions` - Create prescription (Doctor)
- `POST /prescriptions/:id/dispense` - Dispense medicine (Doctor)
- `GET /patients/:id/prescriptions` - Patient prescriptions

### Dashboard

- `GET /dashboard/admin` - Admin dashboard stats
- `GET /dashboard/doctor` - Doctor dashboard stats
- `GET /dashboard/clerk` - Data clerk dashboard stats

### Reports

- `GET /reports/patients` - Patient reports
- `GET /reports/visits` - Visit reports
- `GET /reports/medicines` - Medicine reports
- `GET /reports/daily` - Daily report
- `GET /reports/monthly` - Monthly report
- `GET /reports/yearly` - Yearly report

### Settings

- `GET /settings` - Get clinic settings
- `PUT /settings` - Update settings (Super Admin)

## Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── scripts/         # Helper scripts
│   └── server.js        # Entry point
├── uploads/             # File uploads
├── logs/               # Application logs
├── .env                # Environment variables
├── .env.example        # Environment template
└── package.json        # Dependencies
```

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Role-based authorization
- Request rate limiting
- Helmet security headers
- CORS configuration
- Input validation & sanitization
- SQL injection prevention (Sequelize ORM)
- File upload restrictions
- Audit logging

## License

MIT
