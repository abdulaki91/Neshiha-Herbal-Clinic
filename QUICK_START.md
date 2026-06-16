# ⚡ Quick Start Guide

Get the Neshiha Herbal Clinic system running in 5 minutes!

## 🎯 Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check PostgreSQL (need v14+)
psql --version

# Check npm
npm --version
```

## 🚀 Quick Setup (Copy & Paste)

### 1. Backend Setup

```bash
# Go to Backend
cd Backend

# Install packages
npm install

# Create database
createdb neshiha_clinic

# Setup database tables & seed data
npm run migrate && npm run seed

# Start backend (keep this terminal open)
npm run dev
```

✅ Backend running on **http://localhost:5000**

### 2. Frontend Setup (New Terminal)

```bash
# Go to Frontend
cd Frontend

# Install packages
npm install

# Start frontend
npm run dev
```

✅ Frontend running on **http://localhost:5173**

## 🔑 Login & Test

1. Open browser: **http://localhost:5173/signin**

2. Login with:

   ```
   Email: admin@neshihaclinic.com
   Password: Admin@123
   ```

3. You're in! 🎉

## 🧪 Quick Test

**Test Real-Time Features:**

1. Open TWO browser tabs
2. Tab 1: Login as Clerk (`clerk@neshihaclinic.com` / `Clerk@123`)
3. Tab 2: Login as Doctor (`doctor@neshihaclinic.com` / `Doctor@123`)
4. Tab 1: Register a new patient
5. Tab 1: Create a visit for that patient
6. Tab 2: Watch the queue update instantly! 🔥

## ⚠️ Common Issues

**Database Error?**

```bash
# Make sure PostgreSQL is running
# Windows: Check Services
# Linux: sudo systemctl start postgresql
```

**Port Already in Use?**

```bash
# Change port in Backend/.env
PORT=5001
```

**Frontend Won't Start?**

```bash
cd Frontend
rm -rf node_modules
npm install
npm run dev
```

## 📚 Need More Help?

See `COMPLETE_SETUP_GUIDE.md` for detailed instructions.

---

**That's it! Your clinic system is now running with real-time updates! 🎊**
