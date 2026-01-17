# 🚀 Quick Start - Authentication Testing

## ⚡ Fast Track (5 Minutes)

### 1. Disable Email Confirmation (IMPORTANT!)

Before testing, you need to disable email confirmation:

1. Open: https://supabase.com/dashboard/project/qwxtajsfwowbsbtmzlsx/auth/settings
2. Scroll to **Email Auth** section
3. **Uncheck** "Enable email confirmations"
4. Click **Save**

### 2. Open Application

The dev server is already running at:
```
http://localhost:5174/
```

### 3. Test Authentication

#### A. Sign Up
1. Click **"Don't have an account? Sign Up"**
2. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123`
3. Click **"Sign Up"**
4. Should see success message

#### B. Sign In
1. Enter same credentials:
   - Email: `test@example.com`
   - Password: `test123`
2. Click **"Sign In"**
3. You're in! 🎉

### 4. Test Multi-Tenancy

#### Create Data for User 1
1. Go to **Customers** → Click **"Add Customer"**
2. Add a customer (e.g., "PT Test Company")
3. Go to **Items** → Add an item
4. Go to **Invoice** → Create an invoice

#### Test Data Isolation
1. Click **Logout** (top right)
2. Click **"Sign Up"** again
3. Create new account:
   - Email: `test2@example.com`
   - Password: `test123`
4. Sign in with new account
5. Go to **Customers** → Should be EMPTY!
6. Each user sees only their own data ✅

### 5. Test Session Persistence
1. While logged in, **refresh the page** (F5)
2. You should remain logged in
3. Session is maintained automatically ✅

---

## ✅ What to Verify

- [ ] Sign up works
- [ ] Sign in works
- [ ] Can create customers
- [ ] Can create items
- [ ] Can create invoices
- [ ] Data is isolated per user
- [ ] Session persists on refresh
- [ ] Logout works

---

## 🐛 If Something Goes Wrong

### "Email not confirmed" error
→ You forgot to disable email confirmation (see step 1)

### Can't sign in
→ Make sure you're using the same email/password you signed up with

### Don't see any data
→ That's correct! Each user has isolated data. Create new data for current user.

### Page won't load
→ Check if dev server is running: `npm run dev`

---

## 📊 Test Results Expected

### Before Authentication
- ❌ Cannot access dashboard
- ❌ Cannot create data
- ✅ See login page

### After Sign In
- ✅ Can access dashboard
- ✅ Can create customers, items, invoices
- ✅ Can see own data only
- ✅ Session persists

### After Sign Out
- ❌ Redirected to login
- ❌ Cannot access protected pages
- ✅ Session cleared

---

## 🎯 Success Criteria

If you can do all of these, authentication is working perfectly:

1. ✅ Sign up with new email
2. ✅ Sign in with credentials
3. ✅ Create a customer
4. ✅ Sign out
5. ✅ Sign up with different email
6. ✅ Don't see previous user's data
7. ✅ Create new data for new user
8. ✅ Refresh page and stay logged in

---

## 📝 Quick Commands

```bash
# Start dev server (if not running)
npm run dev

# Run automated test
node test-auth.js

# Check TypeScript
npm run typecheck

# Build for production
npm run build
```

---

## 🔗 Important Links

- **Application:** http://localhost:5174/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qwxtajsfwowbsbtmzlsx
- **Auth Settings:** https://supabase.com/dashboard/project/qwxtajsfwowbsbtmzlsx/auth/settings
- **Database:** https://supabase.com/dashboard/project/qwxtajsfwowbsbtmzlsx/editor

---

## ✨ That's It!

Authentication is fully implemented and ready to test.

**Next:** Open http://localhost:5174/ and start testing! 🚀
