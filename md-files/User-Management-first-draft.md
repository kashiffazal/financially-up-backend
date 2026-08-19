# Implementation Plan - Scalable User Authentication, RBAC & Profile Management (JWT + Bcrypt)

Design and implement a scalable, enterprise-grade **Authentication, Role-Based Access Control (RBAC), and User Profile Management System** for the **Financially Up ERP**.

The system will start with the primary administrator account (`admin@financiallyup.com.au` / `123456`) and is architected for future multi-role scalability (`Admin`, `Manager`, `Accountant`, `Staff`, `Viewer`), user profile customization (photo, phone, department, bio), and full security audit logging.

---

## User Review Required

> [!IMPORTANT]
> - **Backend Packages Required**: We will install `jsonwebtoken` and `bcryptjs` on the backend server for standard JWT token signing and salted bcrypt password hashing.
> - **Database Synchronization**: The Sequelize `User` and `UserAuditLog` tables will automatically sync with the existing MySQL database on server startup.
> - **Default Admin Seed**: On startup, the system will automatically seed the initial admin account (`admin@financiallyup.com.au` / `123456` with role `Admin`) if it does not already exist.

---

## Proposed Changes

### Component 1: Backend Database Models & Auto-Seeding

#### [NEW] [`models/User.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/models/User.js)
- Fields:
  - `id`: BIGINT (Auto-increment, Primary Key)
  - `firstName`: STRING(100), default: "Kashif"
  - `lastName`: STRING(100), default: "Fazal"
  - `email`: STRING(150), unique, indexed
  - `password`: STRING(255) (bcrypt hash)
  - `phone`: STRING(30), nullable
  - `role`: ENUM("Admin", "Manager", "Accountant", "Staff", "Viewer"), default: "Admin"
  - `department`: STRING(100), default: "Taxation & Accounting"
  - `jobTitle`: STRING(100), default: "Senior Tax Agent & Practice Administrator"
  - `bio`: TEXT, nullable
  - `avatar`: TEXT, nullable (relative path to uploaded image)
  - `permissions`: JSON (array of capability strings, e.g. `["*"]` for Admin)
  - `status`: ENUM("Active", "Inactive", "Suspended"), default: "Active"
  - `lastLoginAt`: DATE, nullable
  - `lastLoginIp`: STRING(45), nullable
  - `timestamps`: `createdAt`, `updatedAt`

#### [NEW] [`models/UserAuditLog.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/models/UserAuditLog.js)
- Fields:
  - `id`: BIGINT (Auto-increment, Primary Key)
  - `userId`: BIGINT, nullable
  - `action`: STRING(100) (e.g. `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PROFILE_UPDATED`, `PASSWORD_CHANGED`)
  - `details`: TEXT
  - `ipAddress`: STRING(45)
  - `userAgent`: TEXT
  - `createdAt`: DATE

#### [MODIFY] [`models/index.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/models/index.js)
- Import `User` and `UserAuditLog`.
- Define association: `User.hasMany(UserAuditLog, { foreignKey: 'userId', as: 'auditLogs' });`.
- Export `User` and `UserAuditLog`.

#### [NEW] [`utils/seedAdmin.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/utils/seedAdmin.js)
- Checks if user `admin@financiallyup.com.au` exists.
- If not, hashes `123456` with bcrypt and inserts the default Admin record with full permissions `["*"]`.

---

### Component 2: Backend Auth Controller, Middleware & Routes

#### [NEW] [`middleware/auth.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/middleware/auth.js)
- `verifyToken`: Validates `Authorization: Bearer <token>` using `jsonwebtoken`. Extracts decoded user info and checks if user is active.
- `requireRoles(...roles)`: Middleware guard to ensure user has permitted role.
- `requirePermission(permission)`: Middleware guard for granular permissions.

#### [NEW] [`controllers/auth.controller.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/controllers/auth.controller.js)
- `login`:
  - Validates email & password using `bcrypt.compare`.
  - Verifies user `status === "Active"`.
  - Generates signed JWT token with configurable expiry (`7d`).
  - Records `lastLoginAt`, `lastLoginIp`, and inserts `LOGIN_SUCCESS` in `UserAuditLog`.
  - Returns JWT token and sanitized user profile.
- `getMe`:
  - Fetches the latest authenticated user profile.
- `updateProfile`:
  - Updates first name, last name, phone, department, jobTitle, bio.
  - Supports avatar file upload via Multer (saved to `public/uploads/avatars/`).
  - Logs `PROFILE_UPDATED` in `UserAuditLog`.
- `changePassword`:
  - Validates old password, hashes new password with bcrypt, updates DB, logs `PASSWORD_CHANGED`.
- `getAuditLogs`:
  - Returns paginated activity and security logs for the user/system.

#### [NEW] [`routes/auth.routes.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/routes/auth.routes.js)
- `POST /api/auth/login`
- `GET /api/auth/me` (Protected)
- `PUT /api/auth/profile` (Protected, Multer avatar upload)
- `PUT /api/auth/change-password` (Protected)
- `GET /api/auth/audit-logs` (Protected)

#### [MODIFY] [`app.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/app.js)
- Mount `app.use("/api/auth", authRoutes);`.

#### [MODIFY] [`.env.development`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/.env.development) & [`.env.production`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-backend/.env.production)
- Add `JWT_SECRET=financially_up_secure_jwt_secret_key_2026` and `JWT_EXPIRES_IN=7d`.

---

### Component 3: Frontend Services, Context & Protected Layout

#### [NEW] [`services/auth.service.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/services/auth.service.js)
- `login({ email, password, remember })`
- `getMe()`
- `updateProfile(formData)`
- `changePassword({ currentPassword, newPassword })`
- `getAuditLogs()`
- `logout()`

#### [MODIFY] [`services/apiConfig.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/services/apiConfig.js)
- Auto-attach `Authorization: Bearer <token>` from `localStorage` in `apiFetch`.
- Auto-redirect to `/admin/login` on `401 Unauthorized`.

#### [NEW] [`context/AuthContext.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/context/AuthContext.js)
- Provides React Context: `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`, `updateUser`.
- Wrapped in `app/layout.js` or `app/admin/layout.js`.

#### [MODIFY] [`app/admin/login/page.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/app/admin/login/page.js) & [`LoginForm.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/app/admin/login/LoginForm.js)
- Connect real API submission to `authService.login`.
- Display feedback on invalid credentials or server errors.
- On success, store token and redirect to `/admin/dashboard`.

#### [MODIFY] [`components/admin/Header.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/components/admin/Header.js)
- Display dynamic user name, role, and avatar/initials from `AuthContext`.
- Connect "My Profile" dropdown action to navigate to `/admin/profile`.
- Connect "Sign Out" to clear token and redirect to `/admin/login`.

#### [MODIFY] [`app/admin/layout.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/app/admin/layout.js)
- Add client-side route guard: if user is not authenticated and is on a protected `/admin/*` page, redirect to `/admin/login`.

---

### Component 4: Modern User Profile & Settings Page

#### [NEW] [`app/admin/profile/page.js`](file:///d:/xampp/htdocs/myProjects/nextjs/financially-up/financially-up-frontend/app/admin/profile/page.js)
Create a responsive, high-aesthetic profile dashboard with Ant Design + Tailwind CSS tabs:
1. **Overview & Personal Details Tab**:
   - Profile Header Banner with avatar, user badge, email, role, and quick actions.
   - Form fields: First Name, Last Name, Email (read-only with "Verified" badge), Phone Number, Department, Job Title, Short Bio.
2. **Profile Avatar Upload**:
   - Image upload with drag & drop, format validation (PNG/JPG/JPEG, max 5MB), and instant preview.
3. **Security & Password Tab**:
   - Change Password form: Current Password, New Password, Confirm New Password with strength validation.
4. **Roles & Permissions Tab**:
   - Visual display of assigned role (Admin), department access, and permission chips.
5. **Activity & Audit Log Tab**:
   - Table showing recent user actions: timestamp, action type, IP address, device / user agent.

---

## Verification Plan

### Automated Tests & Linting
1. **Backend Syntax & Sync Verification**:
   - Start backend server, verify `users` and `user_audit_logs` table creation, and verify `admin@financiallyup.com.au` is seeded.
2. **Frontend ESLint Check**:
   ```powershell
   npx eslint app/admin/login/ app/admin/profile/ components/admin/Header.js services/auth.service.js context/AuthContext.js
   ```

### Manual & Subagent End-to-End Verification
1. **Login Flow**:
   - Navigate to `http://localhost:3000/admin/login`.
   - Test invalid password -> verify error message.
   - Test login with `admin@financiallyup.com.au` / `123456` -> verify successful JWT issuance and redirection to `/admin/dashboard`.
2. **Profile Navigation & Display**:
   - Click Header user avatar menu -> click "My Profile" -> verify navigation to `/admin/profile`.
   - Verify all seeded admin details (Kashif Fazal, Administrator, `admin@financiallyup.com.au`) are displayed.
3. **Profile Edit Flow**:
   - Update phone number, job title, and bio -> submit form.
   - Verify success notification and updated user state across Header and Profile.
4. **Security & Password Change**:
   - Change password -> verify old password check and success state.
5. **Audit Trail**:
   - Check Activity & Audit Log tab to confirm login and profile update events are logged.
6. **Sign Out Guard**:
   - Click "Sign Out" -> verify token is cleared and user is redirected to `/admin/login`.
   - Attempt to access `/admin/dashboard` directly while logged out -> verify automatic redirection to `/admin/login`.
