# IntelliSight Dashboard - Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Prerequisites Check
```powershell
# Check Node.js version (must be 16+)
node --version

# Check if backend is running
curl http://localhost:3000/health
```

### Step 2: Install Dashboard
```powershell
cd admin-dashboard
npm install
```

### Step 3: Configure Environment
```powershell
# Create .env file
copy .env.example .env

# .env should contain:
VITE_API_BASE_URL=http://localhost:3000/api
VITE_POLLING_INTERVAL=5000
```

### Step 4: Start Development Server
```powershell
npm run dev
```

Dashboard opens at: `http://localhost:3001`

---

## 🔐 Login Credentials

```
Email: john.admin@intellisight.com
Password: admin123
```

---

## ✅ Testing Checklist

### 1. Authentication
- [ ] Can login with admin credentials
- [ ] Redirects to dashboard after login
- [ ] Logout works and clears token
- [ ] Protected routes redirect to login when not authenticated

### 2. Dashboard Page
- [ ] Statistics cards show correct data
- [ ] Recent activity feed displays
- [ ] Zone overview shows all zones
- [ ] Auto-refresh works (every 5 seconds)
- [ ] Manual refresh button works

### 3. Zones Page
- [ ] All zones displayed
- [ ] Person count shows for each zone
- [ ] Can click zone to view details
- [ ] Zone detail page shows persons in zone
- [ ] Entry time and duration calculated correctly

### 4. Students Page
- [ ] All students listed
- [ ] Search works by name/email/roll number
- [ ] Data displays correctly (name, email, department)

### 5. Teachers Page
- [ ] All teachers listed
- [ ] Search works by name/email/designation
- [ ] Data displays correctly

### 6. Logs Page
- [ ] Activity logs displayed
- [ ] Can filter by number of entries (25/50/100)
- [ ] Auto-refresh works
- [ ] Timestamps formatted correctly

### 7. Settings Page
- [ ] Can view current settings
- [ ] API URL displayed
- [ ] Polling interval shown
- [ ] System info displayed

---

## 🐛 Troubleshooting

### Issue: Dashboard won't start
```powershell
# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install
npm run dev
```

### Issue: Can't login
```
Problem: "Login failed" error
Solution: 
1. Check backend is running: curl http://localhost:3000/health
2. Verify credentials: john.admin@intellisight.com / admin123
3. Check browser console for errors
```

### Issue: Data not loading
```
Problem: Dashboard shows "No data" everywhere
Solution:
1. Verify VITE_API_BASE_URL in .env
2. Check backend has data (students, teachers, zones)
3. Open browser DevTools Network tab and check API calls
4. Ensure backend is accessible at http://localhost:3000
```

### Issue: Real-time updates not working
```
Problem: Data doesn't auto-refresh
Solution:
1. Check VITE_POLLING_INTERVAL in .env (should be 5000)
2. Check browser console for errors
3. Manual refresh should still work
```

---

## 📊 Test Data

### Expected Dashboard Stats
- **Students**: ~10+ students
- **Teachers**: ~5+ teachers
- **Zones**: 4 zones (Zone 1, Zone 2, Zone 3, Zone 4)
- **Active Persons**: Varies based on current tracking

### Sample API Test
```powershell
# Get all zones
curl http://localhost:3000/api/zones

# Get students
curl http://localhost:3000/api/students

# Get active persons
curl http://localhost:3000/api/timetable/active
```

---

## 🎯 Production Deployment

### Build for Production
```powershell
npm run build
```

### Preview Production Build
```powershell
npm run preview
```

### Deploy to Vercel
```powershell
npm install -g vercel
vercel login
vercel
```

**Set environment variables in Vercel:**
- `VITE_API_BASE_URL` = Your production backend URL
- `VITE_POLLING_INTERVAL` = 5000

---

## 📝 Development Tips

### Hot Reload
Vite automatically reloads on file changes. No need to restart.

### API Debugging
Check browser DevTools → Network tab to see all API calls.

### State Debugging
Install React DevTools extension to inspect component state.

### Styling
All styles use TailwindCSS. Modify `tailwind.config.js` for custom colors.

---

## 🔗 Important URLs

- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Backend Health**: http://localhost:3000/health

---

## ✨ Success!

If you can:
1. ✅ Login successfully
2. ✅ See dashboard statistics
3. ✅ View zones with person counts
4. ✅ Navigate all pages without errors

**Your IntelliSight Dashboard is ready to use! 🎉**
