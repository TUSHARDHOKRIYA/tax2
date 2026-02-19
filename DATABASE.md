# Database Integration & Authentication Plan

## Current State Analysis

### What We Have Now
- **Frontend-only** React/TypeScript application with Vite
- **Mock data** stored in `src/data/mockData.ts` (hardcoded)
- Data types include:
  - Companies (customers/vendors)
  - Inventory Items (products)
  - Seller Information (business profile)
  - Bank Details
  - Invoices (generated on-the-fly)

### The Problem
- Data is lost on page refresh
- No user authentication
- No persistent storage
- All users share the same mock data
- No invoice history

---

## Solution Architecture

### Tech Stack (Recommended)

#### Backend
- **Framework**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL (robust, relational, perfect for financial data)
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- **ORM**: Prisma (type-safe database access from TypeScript)
- **Validation**: Zod (runtime type validation)

#### Frontend
- **Keep existing**: React + TypeScript + Vite
- **Additional libraries**: 
  - `axios` or `fetch` for API calls
  - `zustand` for state management (replaces localStorage)
  - `jwtdecode` for token handling

#### Deployment
- **Backend**: Render.com, Railway.app, or AWS EC2
- **Database**: Managed PostgreSQL on cloud platform
- **Frontend**: Netlify (already configured)

---

## Database Schema Design

### Tables & Relationships

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ password (hash) │
│ name            │
│ createdAt       │
└────────┬────────┘
         │ (1:many)
         │
         ├─── ┌──────────────────┐
         │    │   Companies      │
         │    ├──────────────────┤
         │    │ id (PK)          │
         │    │ userId (FK)      │
         │    │ gstNo            │
         │    │ name             │
         │    │ address          │
         │    │ state            │
         │    │ stateCode        │
         │    │ pendingAmount    │
         │    │ lastTransaction  │
         │    │ createdAt        │
         │    └────────┬─────────┘
         │             │ (1:many)
         │             │
         │             └─── ┌──────────────────────┐
         │                  │   Invoices           │
         │                  ├──────────────────────┤
         │                  │ id (PK)              │
         │                  │ companyId (FK)       │
         │                  │ invoiceNumber (UNIQ) │
         │                  │ totalAmount          │
         │                  │ taxAmount            │
         │                  │ status               │
         │                  │ createdAt            │
         │                  │ dueDate              │
         │                  └────────┬─────────────┘
         │                           │ (1:many)
         │                           │
         │                           └─── ┌───────────────────────┐
         │                                │  InvoiceLineItems     │
         │                                ├───────────────────────┤
         │                                │ id (PK)               │
         │                                │ invoiceId (FK)        │
         │                                │ inventoryItemId (FK)  │
         │                                │ quantity              │
         │                                │ unitPrice             │
         │                                │ discount              │
         │                                │ taxRate               │
         │                                │ lineTotal             │
         │                                └───────────────────────┘
         │
         ├─── ┌──────────────────┐
         │    │ InventoryItems   │
         │    ├──────────────────┤
         │    │ id (PK)          │
         │    │ userId (FK)      │
         │    │ name             │
         │    │ hsn              │
         │    │ rate             │
         │    │ stock            │
         │    │ unit             │
         │    │ gstRate          │
         │    │ createdAt        │
         │    └──────────────────┘
         │
         ├─── ┌──────────────────┐
         │    │  SellerInfo      │
         │    ├──────────────────┤
         │    │ id (PK)          │
         │    │ userId (FK)      │
         │    │ name             │
         │    │ address          │
         │    │ city             │
         │    │ state            │
         │    │ stateCode        │
         │    │ pincode          │
         │    │ gstNo            │
         │    │ pan              │
         │    │ phone            │
         │    │ email            │
         │    │ createdAt        │
         │    └──────────────────┘
         │
         └─── ┌──────────────────┐
              │  BankDetails     │
              ├──────────────────┤
              │ id (PK)          │
              │ userId (FK)      │
              │ bankName         │
              │ accountName      │
              │ accountNumber    │
              │ ifscCode         │
              │ branch           │
              │ createdAt        │
              └──────────────────┘
```

### Table Details

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gstNo VARCHAR(15) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  state VARCHAR(100),
  stateCode VARCHAR(2),
  pendingAmount DECIMAL(12,2) DEFAULT 0,
  lastTransaction TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, gstNo)
);
```

#### InventoryItems Table
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hsn VARCHAR(8) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  gstRate DECIMAL(5,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companyId UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
  totalAmount DECIMAL(12,2) NOT NULL,
  taxAmount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dueDate TIMESTAMP
);
```

---

## Authentication Flow

### Registration
1. User submits email & password
2. Password hashed using bcrypt
3. User created in database
4. Automatic login with JWT tokens

### Login
1. User submits email & password
2. Query database for user
3. Verify password hash
4. Generate JWT tokens:
   - **Access Token** (15 min expiry): For API requests
   - **Refresh Token** (7 days expiry): For getting new access tokens
5. Return tokens to frontend
6. Frontend stores in:
   - Access token → Memory/State (secure, no XSS risk)
   - Refresh token → HTTP-only cookie (XSS protected)

### JWT Structure
```json
Access Token {
  "sub": "user-id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234569690
}
```

---

## Step-by-Step Implementation Plan

### Phase 1: Backend Setup (Days 1-2)

#### Step 1.1: Create Backend Project
```bash
mkdir taxprint-pro-backend
cd taxprint-pro-backend
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken prisma @prisma/client zod axios
npm install -D typescript @types/express @types/node ts-node
```

#### Step 1.2: Setup Database
- Create PostgreSQL database (local or cloud)
- Setup Prisma
- Create schema.prisma with all tables
- Run migrations

#### Step 1.3: Create API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/companies` - Get user's companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- (Similar CRUD for inventory items, seller info, etc.)

#### Step 1.4: Middleware Setup
- Authentication middleware (verify JWT)
- Authorization middleware (ensure user owns resource)
- Error handling
- Request validation with Zod

### Phase 2: Frontend Integration (Days 3-4)

#### Step 2.1: Add API Client
- Create `src/lib/api.ts` with axios instance
- Interceptors for JWT handling
- Automatic token refresh

#### Step 2.2: Create Auth Pages
- Login page
- Register page
- Logout functionality

#### Step 2.3: Setup State Management
- Create Zustand store for:
  - Current user
  - Auth tokens
  - Companies list
  - Inventory items
  - Seller info

#### Step 2.4: Update Components
- Replace `mockData.ts` imports with API calls
- Add loading/error states
- Implement CRUD operations via API

#### Step 2.5: Add Route Protection
- Create ProtectedRoute component
- Redirect unauthenticated users to login
- Check token validity on app start

### Phase 3: Testing & Deployment (Days 5-6)

#### Step 3.1: Testing
- Test registration flow
- Test login/logout
- Test data persistence
- Test multiple users with separate data

#### Step 3.2: Database Backup & Recovery
- Setup automated backups
- Document recovery procedures

#### Step 3.3: Deploy Backend
- Push to Render.com or Railway
- Setup environment variables
- Configure CORS for frontend

#### Step 3.4: Update Frontend Deployment
- Update API base URL for production
- Redeploy to Netlify

---

## Data Migration Strategy

### Current Mock Data → Database

#### Step 1: Seed Admin User
```typescript
// Create a default user/company for initial migration
const adminUser = await prisma.users.create({
  data: {
    email: 'admin@example.com',
    password: hashedPassword,
    name: 'Admin User',
  }
});
```

#### Step 2: Migrate Inventory Items
- Read from `mockData.ts`
- Insert into database
- Update component imports

#### Step 3: Migrate Companies
- Read from `mockData.ts`
- Insert into database
- Associate with admin user

#### Step 4: Migrate Seller & Bank Info
- Read from `mockData.ts`
- Create first SellerInfo & BankDetails for admin user

---

## Security Considerations

### Password Security
- Hash with bcrypt (salt rounds: 10)
- Never log or expose passwords
- Implement password requirements (min 8 chars, uppercase, number, special char)

### JWT Security
- Access token: 15 minutes
- Refresh token: 7 days
- Refresh token stored in HTTP-only, secure cookie
- Implement token rotation on refresh

### API Security
- CORS: Only allow frontend domain
- HTTPS enforced in production
- Rate limiting on auth endpoints (prevent brute force)
- Input validation with Zod
- SQL injection prevention via Prisma ORM

### Data Privacy
- Encrypt sensitive data (GST No, bank details)
- Implement user data deletion
- GDPR compliance (if applicable)

---

## Database Backup Strategy

### Automated Backups
- Daily automated backups (via hosting provider)
- 30-day retention policy
- Test backup restoration monthly

### Manual Export
```bash
# PostgreSQL dump
pg_dump -h localhost -U user database_name > backup.sql

# Restore from backup
psql -h localhost -U user database_name < backup.sql
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/taxprint
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,https://taxprint.netlify.app
PORT=5000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
```

---

## Key Files to Create/Modify

### Backend Structure
```
taxprint-pro-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── jwt.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── companies.ts
│   │   ├── inventory.ts
│   │   ├── invoices.ts
│   │   ├── seller.ts
│   │   └── bank.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── companiesController.ts
│   │   └── ... (one per resource)
│   ├── types/
│   │   └── index.ts
│   ├── validators/
│   │   └── schemas.ts
│   ├── utils/
│   │   └── password.ts
│   ├── server.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── tsconfig.json
```

### Frontend Structure Changes
```
src/
├── api/
│   ├── client.ts           (NEW: axios setup)
│   ├── auth.ts             (NEW: auth endpoints)
│   ├── companies.ts        (NEW: companies endpoints)
│   ├── inventory.ts        (NEW: inventory endpoints)
│   ├── invoices.ts         (NEW: invoices endpoints)
│   ├── seller.ts           (NEW: seller endpoints)
│   └── bank.ts             (NEW: bank endpoints)
├── store/
│   └── authStore.ts        (NEW: Zustand store)
├── pages/
│   ├── Login.tsx           (NEW)
│   ├── Register.tsx        (NEW)
│   └── Index.tsx           (modify)
├── components/
│   ├── ProtectedRoute.tsx  (NEW)
│   └── (modify existing)
└── (existing structure)
```

---

## Testing Checklist

- [ ] User can register with email & password
- [ ] User can login with credentials
- [ ] Data is NOT shared between users
- [ ] Adding company saves to database
- [ ] Editing company updates database
- [ ] Deleting company removes from database
- [ ] Inventory items persist across login/logout
- [ ] Invoice history is preserved
- [ ] Access token refreshes automatically
- [ ] Logout clears all tokens
- [ ] Page refresh maintains login state
- [ ] New invoice numbers don't duplicate
- [ ] Stock levels update correctly
- [ ] PDF generation uses database data

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Backend Setup | 2 days | ⏳ Pending |
| 2. Frontend Integration | 2 days | ⏳ Pending |
| 3. Testing & Deployment | 2 days | ⏳ Pending |
| **Total** | **6 days** | ⏳ Pending |

---

## Common Issues & Solutions

### CORS Errors
**Problem**: Frontend can't reach backend
**Solution**: 
- Check CORS_ORIGIN in backend .env
- Ensure frontend URL is whitelisted
- Check network tab in browser devtools

### JWT Token Expired
**Problem**: Requests fail after 15 minutes
**Solution**:
- Implement automatic refresh token mechanism
- Test refresh flow in frontend
- Check token expiry times in JWT_SECRET config

### Data Loss on Deploy
**Problem**: Database data disappears after redeployment
**Solution**:
- Use managed database (not local SQLite)
- Setup automated backups
- Never delete database when redeploying backend

### Duplicate Invoice Numbers
**Problem**: Two invoices get same number
**Solution**:
- Ensure UNIQUE constraint on invoiceNumber
- Use UUID for invoice IDs (not sequential)
- Database-level constraint prevents duplicates

---

## Next Steps

1. **Review this plan** - Ensure approach aligns with requirements
2. **Setup backend project** - Initialize Node.js/Express structure
3. **Create database** - PostgreSQL setup and schema
4. **Implement auth** - Registration & login endpoints
5. **Implement CRUD** - Create API endpoints for all resources
6. **Integrate frontend** - Update React components to use API
7. **Test thoroughly** - All user flows and edge cases
8. **Deploy** - Backend on Render/Railway, Frontend on Netlify

---

## Questions to Clarify

Before starting implementation, confirm:

1. **Database Hosting**: Use PostgreSQL on cloud (Render, Railway, AWS RDS)?
2. **Backend Hosting**: Render.com, Railway.app, or AWS EC2?
3. **User Authentication**: Email/password only, or email + extra fields?
4. **Multi-Company**: Can one user manage multiple companies?
5. **Audit Trail**: Need to track who changed what and when?
6. **Invoice Sharing**: Can users share invoices with others?
7. **Subscription**: Free tier or paid features?
8. **Backup Frequency**: Daily, weekly, or monthly backups?

---

## Helpful Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Zod Validation](https://zod.dev)
- [Zustand Store](https://github.com/pmndrs/zustand)

---

**Status**: 📋 Planning Phase - Awaiting approval to proceed with Phase 1
