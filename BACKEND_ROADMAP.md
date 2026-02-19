# Supabase Implementation Roadmap

## Phase 1: Admin-Only Login with Supabase

### Key Point Before Starting
⚠️ **When copying SQL code from this guide**: Copy ONLY the code between the backticks (` ``` `). Do NOT copy the backticks themselves. The backticks are just markdown formatting to make the code look nice in this document.

**How to Copy SQL Correctly:**

1. Find the SQL code block (starts with ` ```sql `)
2. Click at the beginning of `CREATE TABLE` (NOT at the ` ``` ` line)
3. Drag to select until the last semicolon `;`
4. Copy the selected text
5. Paste in Supabase SQL Editor
6. Click **"Run"**

Example:
```
❌ WRONG - Includes backticks:
```sql
CREATE TABLE...
```

✅ CORRECT - Only SQL:
CREATE TABLE...
```

---

### Objective
Create a fully functional admin login system using Supabase auth. Signup UI exists but disabled with a feature flag.

### Timeline: 1-2 Days (Much faster than traditional backend!)

### Why Supabase?

✅ **No backend server to deploy** - Supabase handles everything  
✅ **PostgreSQL included** - Same database technology, managed for you  
✅ **Built-in Authentication** - Admin login ready in minutes  
✅ **Row-Level Security (RLS)** - Users see only their own data automatically  
✅ **Free tier** - Generous free limits  
✅ **Real-time database** - Get updates instantly  
✅ **Less code to maintain** - Focus on frontend  

### Architecture (Simpler!)

```
┌─────────────────────────────────┐
│   React Frontend                │
│   (localhost:5173)              │
│                                 │
│   uses @supabase/supabase-js    │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   SUPABASE (Cloud)              │
│                                 │
│   ├─ Auth System                │
│   ├─ PostgreSQL Database        │
│   ├─ Row-Level Security (RLS)   │
│   └─ Real-time Listeners        │
│                                 │
│   URL: https://your-id.supabase.co
└─────────────────────────────────┘

NO SEPARATE BACKEND NEEDED!
```

---

## STEP 1: Create Supabase Account & Project (15 min)

### 1.1: Create Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. **Sign up** with email or GitHub
4. Verify your email
5. Create organization (if asked)

### 1.2: Create Project

1. Click **"New Project"**
2. **Name your project**: `taxprint-pro`
3. **Create a secure password** (save this!)
4. **Region**: Choose closest to you (e.g., Singapore/India if available, otherwise Europe)
5. Click **"Create new project"**
6. Wait ~2 minutes for setup

### 1.3: Get Your Credentials

Once project is created:

1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxx.supabase.co`)
   - **anon key** (public key)
   - **service_role key** (keep secret!)

Save in `.env.local` in your frontend project:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## STEP 2: Setup Database Schema (30 min)

### 2.1: Open SQL Editor

In Supabase dashboard:
1. Click **"SQL Editor"** on left sidebar
2. Click **"New Query"**

### 2.2: Copy and Run All SQL Queries

**📁 See [SQL_QUERIES.sql](SQL_QUERIES.sql) file for all database setup SQL code**

**How to run the SQL:**

1. Open [SQL_QUERIES.sql](SQL_QUERIES.sql) file in VS Code (same directory as this file)
2. Copy ALL the SQL code (lines with CREATE TABLE, CREATE POLICY, etc.)
3. Go to Supabase dashboard → **SQL Editor**
4. Click **"New Query"**
5. Paste the entire SQL code
6. Click **"Run"** button
7. Wait for success message ✅

**Tables that will be created:**
- `profiles` - User profile information
- `companies` - Customer/vendor companies
- `inventory_items` - Products/inventory
- `invoices` - Invoice headers
- `invoice_line_items` - Invoice line details
- `seller_info` - Your business information
- `bank_details` - Bank account information

**All tables include Row-Level Security (RLS) automatically enabled!**

---

## STEP 3: Create Admin User (10 min)

### 3.1: Using Supabase Dashboard

1. Go to **Authentication → Users** in Supabase dashboard
2. Click **"Add user"**
3. Enter:
   - **Email**: `admin`
   - **Password**: `admin`
   - Confirm password
4. Click **"Create user"**
5. Check the user is created with status **"Confirmed"**

### 3.2: Add Admin to Profiles Table

1. This is already included in the [SQL_QUERIES.sql](SQL_QUERIES.sql) file you ran in STEP 2
2. The admin profile was automatically created when you ran all the SQL code
3. No additional action needed - the seed query is included in the SQL file

---

## STEP 4: Setup Frontend Dependencies (15 min)

### 4.1: Install Supabase Library

```powershell
cd "C:\Users\LOQ\Desktop\invoice Software\taxprint-pro-main\taxprint-pro-main"
npm install @supabase/supabase-js
```

### 4.2: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.3: Create Auth Store (Zustand)

Install Zustand:

```powershell
npm install zustand
```

Create `src/store/authStore.ts`:

```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
        },
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  checkSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        set({ user: null, loading: false });
        return;
      }

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      set({
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: profile?.name,
          role: profile?.role,
        },
        loading: false,
      });
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
}));
```

---

## STEP 5: Create Login Page (30 min)

Create `src/pages/Login.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TaxPrint Pro</h1>
          <p className="text-gray-500 text-sm mt-1">Invoice Management System</p>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-gray-700">Login</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">
            <strong>Demo Credentials:</strong>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Email: <code className="bg-gray-200 px-2 py-1 rounded">admin</code>
          </p>
          <p className="text-sm text-gray-600">
            Password: <code className="bg-gray-200 px-2 py-1 rounded">admin</code>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

---

## STEP 6: Create Signup Page (Disabled) (10 min)

Create `src/pages/Signup.tsx`:

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Feature flag
const SIGNUP_ENABLED = false;

export default function Signup() {
  if (!SIGNUP_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-yellow-600 w-6 h-6" />
            <h2 className="text-2xl font-bold text-gray-700">Sign Up</h2>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-medium">Signup is disabled</p>
            <p className="text-sm mt-2">
              Sign up functionality is currently disabled. Please contact the admin for access.
            </p>
          </div>

          <Button disabled className="w-full">
            Sign Up (Currently Disabled)
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Use demo credentials to login instead.
          </p>
        </Card>
      </div>
    );
  }

  return null;
}
```

---

## STEP 7: Create Protected Route Component (15 min)

Create `src/components/ProtectedRoute.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

## STEP 8: Update App.tsx (20 min)

Update `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

const App = () => {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
```

---

## STEP 9: Create Company Service (30 min)

Create `src/lib/companies.ts`:

```typescript
import { supabase } from './supabase';

export interface Company {
  id: string;
  user_id: string;
  gst_no: string;
  name: string;
  address?: string;
  state?: string;
  state_code?: string;
  pending_amount: number;
  last_transaction?: string;
  created_at: string;
  updated_at: string;
}

export const companiesService = {
  // Get all companies for current user
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create company
  async createCompany(companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update company
  async updateCompany(id: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete company
  async deleteCompany(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Real-time subscription
  subscribeToCompanies(callback: (companies: Company[]) => void) {
    const subscription = supabase
      .from('companies')
      .on('*', (payload) => {
        companiesService.getCompanies().then(callback);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  },
};
```

---

## STEP 10: Add Logout Button (10 min)

Update your main layout/nav component (e.g., `src/components/NavLink.tsx` or where you have navigation):

```typescript
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <div>
        <h1 className="text-xl font-bold">TaxPrint Pro</h1>
        {user && <p className="text-sm text-gray-600">Logged in as: {user.email}</p>}
      </div>

      {user && (
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      )}
    </nav>
  );
}
```

---

## STEP 11: Test Everything Locally (30 min)

1. **Start Frontend**
   ```powershell
   npm run dev
   ```

2. **Visit** `http://localhost:5173/login`

3. **Test Login**
   - Email: `admin`
   - Password: `admin`
   - Should redirect to `/` after successful login

4. **Add a Test Company**
   - Use the form to add a company
   - Check in Supabase dashboard → Table Editor → companies
   - Verify data is saved

5. **Logout**
   - Click logout button
   - Should redirect to `/login`

6. **Test Protected Routes**
   - Try visiting `/` without login
   - Should redirect to `/login`

---

## STEP 12: Deploy to Production (20 min)

### Frontend (Netlify) - Already Configured

1. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify dashboard
   - Go to **Site settings → Build & deploy → Environment**
   - Add the environment variables
   - Trigger redeploy

### Supabase (Already in Production!)

No deployment needed - Supabase backend is already live!

---

## Architecture Comparison

| Aspect | Traditional Backend | Supabase (This) |
|--------|-------------------|-----------------|
| **Backend Server** | Need to deploy | Managed for you |
| **Database** | Need to set up | Included + automated |
| **Auth System** | Build from scratch | Built-in |
| **Maintenance** | Ongoing server upkeep | None needed |
| **Deployment** | 3 services (backend, DB, frontend) | 1 service (frontend) |
| **Cost** | Varies | Free tier generous |
| **Development Time** | 3-4 days | 1-2 days |

---

## Directory Structure

### New Files Created

```
src/
├── lib/
│   ├── supabase.ts              (NEW - Supabase client)
│   └── companies.ts             (NEW - Company services)
├── store/
│   └── authStore.ts             (NEW - Auth state)
├── pages/
│   ├── Login.tsx                (NEW)
│   ├── Signup.tsx               (NEW - disabled)
│   └── Index.tsx                (update to use companiesService)
├── components/
│   ├── ProtectedRoute.tsx        (NEW)
│   ├── NavBar.tsx               (update with logout)
│   └── ... (existing)
└── App.tsx                       (update with routes)

.env.local                        (NEW)
```

---

## Database Schema

All created automatically in Step 2 via SQL editor:

- `profiles` - User information
- `companies` - Customer/vendor companies
- `inventory_items` - Products
- `invoices` - Invoices created
- `invoice_line_items` - Items in invoices
- `seller_info` - Your business info
- `bank_details` - Bank account info

**Row Level Security (RLS)** enabled on ALL tables:
- Users can ONLY see their own data
- Automatic isolation, no additional coding needed

---

## Features Included

✅ **Admin Login** - Email: `admin` | Password: `admin`  
✅ **Signup Disabled** - Feature flag to enable later  
✅ **Data Persistence** - All data stored in PostgreSQL  
✅ **Authentication** - Secure JWT sessions  
✅ **Authorization** - Row-level security on all tables  
✅ **Real-time** - Optional real-time data sync  
✅ **Encrypted** - HTTPS by default  
✅ **Scalable** - Production-ready  

---

## Common Tasks (Everything is in Frontend Now!)

### Add Companies from Frontend

```typescript
import { companiesService } from '@/lib/companies';

// Create
await companiesService.createCompany({
  gst_no: '27AABCU9603R1ZM',
  name: 'My Company',
  address: '123 Main St',
  state: 'Maharashtra',
  state_code: '27',
  pending_amount: 0
});

// Read
const companies = await companiesService.getCompanies();

// Update
await companiesService.updateCompany(id, { name: 'Updated Name' });

// Delete
await companiesService.deleteCompany(id);
```

---

## Troubleshooting

**Q: "Missing Supabase environment variables"**
- Add to `.env.local`:
  ```env
  VITE_SUPABASE_URL=your-url
  VITE_SUPABASE_ANON_KEY=your-key
  ```

**Q: Login not working**
- Check admin user exists in **Auth → Users**
- Verify credentials are correct
- Check browser console for errors

**Q: "RLS policy rejected" error**
- Check RLS policies were created
- Verify user is logged in
- Check table names are correct (use underscores: `user_id` not `userId`)

**Q: Data not saving**
- Check browser console
- Verify RLS allows INSERT
- Check Supabase logs

---

## Enabling Signup Later

When you're ready to enable signup:

1. Update `SIGNUP_ENABLED` to `true` in `src/pages/Signup.tsx`
2. Implement signup form:

```typescript
const handleSignup = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) throw error;

  // Add to profiles table
  await supabase.from('profiles').insert([{
    id: data.user?.id,
    email,
    name
  }]);
};
```

---

## What's Next?

1. ✅ **Test admin login** - Verify works
2. ✅ **Add companies** - Create some test companies
3. ✅ **Check data persistence** - Refresh page, data should remain
4. ✅ **Test logout** - Verify redirect to login
5. 🚀 **Deploy to Netlify** - When ready
6. 🎁 **Enable signup** - When you decide

---

## Quick Reference

```powershell
# Install dependencies
npm install @supabase/supabase-js zustand

# Start frontend
npm run dev

# Access at:
# http://localhost:5173/login

# Supabase dashboard:
# https://supabase.com (login with your account)
```

---

## Key Advantages

🎯 **Zero Backend Maintenance** - Supabase handles everything  
🎯 **Built-in Security** - RLS protects data automatically  
🎯 **Instant Deployment** - Just deploy frontend  
🎯 **Real-time Capable** - Add real-time sync later if needed  
🎯 **Free Tier** - Generous limits for this project  

---

**Status**: 🚀 Ready to implement! Start with STEP 1
