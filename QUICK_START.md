# Quick Start Guide - Subscription Tracker

## 🚀 Quick Commands

### Start Backend
```bash
cd e:\Subscription-tracker\subscription-tracker-backend
mvn spring-boot:run
```
✅ **Running when you see**: `Started SubscriptionTrackerBackendApplication`

### Start Frontend (in new terminal)
```bash
cd e:\Subscription-tracker\subscription-tracker-frontend
npm run dev
```
✅ **Running when you see**: `Local: http://localhost:5173/`

### Access Application
Open browser: **http://localhost:5173**

---

## ✅ Quick Test

1. **Sign Up**: Create account with email/password
2. **Dashboard**: View your subscription overview
3. **Add Subscription**: Go to Subscriptions → Add New
4. **Budget**: Set monthly income and expenses
5. **Verify**: Check PostgreSQL has data

---

## 🔧 Database Setup (One-time)

```sql
CREATE DATABASE subscription_tracker_db;
```

Database will auto-create tables on first backend run.

---

## 📋 Success Indicators

**Backend (Port 8084):**
- ✅ Console: "Tomcat started on port 8084"
- ✅ No database connection errors
- ✅ `curl http://localhost:8084/api/subscriptions/all` works

**Frontend (Port 5173):**
- ✅ Console: "VITE ready"
- ✅ Browser opens http://localhost:5173
- ✅ No CORS errors in browser console (F12)

**Database:**
- ✅ PostgreSQL service running
- ✅ Database `subscription_tracker_db` exists
- ✅ Tables created automatically

---

## 🐛 Common Issues

**Backend won't start?**
- Check PostgreSQL is running
- Verify port 8084 is free
- Check database credentials match

**Frontend can't connect?**
- Ensure backend is running on 8084
- Clear browser cache
- Check browser console for errors

**CORS errors?**
- Both services must be running
- Frontend on 5173, Backend on 8084

---

## 📊 What Was Fixed

1. ✅ API URL: 8080 → 8084
2. ✅ CORS: Added localhost:5173
3. ✅ CSS: Removed conflicting styles
4. ✅ Vite: Configured port 5173

All set! 🎉
