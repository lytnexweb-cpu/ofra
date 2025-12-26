# CRM Yanick - MVP++

Real estate CRM system for managing clients, transactions, conditions, and notes. Built for real estate agents to track transaction workflows, manage client relationships, and monitor condition fulfillment.

## Project Overview

**CRM Yanick** is a real estate transaction management system designed for independent agents. It provides comprehensive tools to:

- **Client Management**: Store client information with detailed contact data (address, multiple phone numbers)
- **Transaction Tracking**: Monitor real estate transactions (purchase/sale) with status history and workflow management
- **Condition Management**: Track transaction conditions (inspection, financing, legal, etc.) with priorities, due dates, and completion status
- **Notes & Documentation**: Add timestamped notes to transactions for communication tracking
- **Dashboard**: Real-time overview of active transactions, overdue conditions, and upcoming deadlines
- **Automated Emails**: Automatic email notifications to clients on transaction status changes (offer accepted, deal firm, closing completed)

This is the **MVP++ release** with enhanced client fields, condition categorization, improved UX, and automated client communications.

## Tech Stack

### Frontend
- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **AdonisJS v6** - TypeScript Node.js framework
- **PostgreSQL** - Relational database
- **Lucid ORM** - Database query builder
- **Session-based Authentication** - Cookie-based auth with httpOnly cookies
- **AdonisJS Mail** - Email service with SMTP transport (Brevo/Sendinblue)

## Requirements

- **Node.js** 18+ recommended
- **npm** 8+ or compatible package manager
- **Docker** and **Docker Compose** (for PostgreSQL)
- **SMTP Account** (optional) - Brevo/Sendinblue account for automated emails (free tier available)

## Email Configuration

The CRM includes automated email notifications sent to clients on transaction status changes. Email configuration is required in `backend/.env`:

```env
# Brevo SMTP Configuration (required for automated emails)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-brevo-login@smtp-brevo.com
SMTP_PASSWORD=your-brevo-api-key
BREVO_API_KEY=your-brevo-api-key

# Email sender information
MAIL_FROM_ADDRESS=notifications@crm-yanick.local
MAIL_FROM_NAME="CRM Yanick"
```

**To set up Brevo (free tier):**
1. Create account at [brevo.com](https://www.brevo.com)
2. Get your SMTP credentials from Settings → SMTP & API
3. Add credentials to `backend/.env`
4. Emails will be sent automatically on transaction status changes

**Note:** Automated emails are fail-safe - if email sending fails, transaction status changes still succeed.

## Quick Start (Development)

### 1. Start PostgreSQL Database

```powershell
# Start PostgreSQL container
docker compose up -d

# Verify database is running
docker ps
# Expected: crm-yanick-postgres running on port 5432
```

### 2. Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Run migrations to create database schema
node ace migration:run

# Seed database with development user
node ace db:seed

# Start development server
npm run dev
```

**Backend will be available at:** `http://127.0.0.1:3333`

### 3. Frontend Setup

```powershell
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

### 4. Access Application

- Open browser: `http://localhost:5173`
- Login with dev credentials (see below)

**Note:** Vite automatically proxies `/api` requests to `http://localhost:3333` (no CORS issues in development).

## Database & Migrations

### Running Migrations

```powershell
cd backend
node ace migration:run
```

### Important Migrations

All migrations must be run on a fresh installation. The following migrations configure the database schema:

| Migration | Purpose |
|-----------|---------|
| `create_users_table` | User accounts with hashed passwords |
| `create_clients_table` | Client records with basic contact info |
| `add_address_and_phones_to_clients` | Address fields + homePhone/workPhone/cellPhone |
| `create_transactions_table` | Transaction records with status and pricing |
| `rename_transaction_notes_to_notes_text` | Renamed `notes` column to `notesText` (fixes collision with notes relation) |
| `create_conditions_table` | Condition tracking with due dates |
| `add_type_and_priority_to_conditions` | Type enum (inspection, financing, etc.) + priority enum (low/medium/high) |
| `create_notes_table` | Transaction notes with author tracking |
| `create_transaction_status_histories_table` | Status change audit trail |

### Seed Data

```powershell
cd backend
node ace db:seed
```

Creates development user account (see credentials below).

## Development Credentials

**Email:** `yanick@crm.local`
**Password:** `password123`

Use these credentials to log in to the application in development mode.

## Features (MVP++)

### Client Management
- ✅ Create, list, and view client details
- ✅ **Address fields**: addressLine1, addressLine2, city, province/state, postalCode
- ✅ **Multiple phone numbers**: Cell phone, home phone, work phone
- ✅ **Delete client** with transaction protection (blocked if client has transactions)
- ✅ View client's transaction history

### Transaction Management
- ✅ Create and list transactions (purchase or sale)
- ✅ Track sale price, offer date, and transaction type
- ✅ Change transaction status with confirmation dialog
- ✅ Status history tracking (audit trail)
- ✅ View detailed transaction page with conditions and notes

### Condition Management
- ✅ Add conditions to transactions with due dates
- ✅ **Condition types**: inspection, financing, appraisal, legal, documents, repairs, other
- ✅ **Priority levels**: low, medium, high (with color-coded badges)
- ✅ Mark conditions as completed
- ✅ Edit and delete conditions
- ✅ **Visual indicators**: Overdue (red), due soon within 7 days (yellow)

### Notes
- ✅ Add timestamped notes to transactions
- ✅ View note author and creation date
- ✅ Delete notes with confirmation dialog
- ✅ Transaction `notesText` field for general transaction notes

### Dashboard
- ✅ Total transactions count
- ✅ Active transactions count
- ✅ Completed transactions count
- ✅ Overdue conditions count
- ✅ Due soon conditions count (next 7 days)
- ✅ **"How it works" guide** with 5-step workflow explanation

### Automated Emails
- ✅ **Automatic client notifications** on transaction status changes
- ✅ **6 professional bilingual email templates** (French + English, 3 for buyers, 3 for sellers)
- ✅ **Purchase workflows**:
  - Offer accepted: Congratulations, condition reminders, next steps
  - Deal FIRM: Transaction confirmed, notary preparation, insurance reminders
  - Closing completed: Congratulations on new property, Google review request
- ✅ **Sale workflows**:
  - Offer accepted: Good news, buyer conditions period, availability reminders
  - Deal FIRM: Sale confirmed, moving preparation, closing date reminder
  - Sale completed: Congratulations, thank you, review/referral request
- ✅ **Bilingual content** (French primary, English secondary) with professional, reassuring tone
- ✅ **Professional branding**: Lytnex Web agency footer on all emails
- ✅ **HTML templates** with responsive design and visual language dividers
- ✅ **Fail-safe design**: Transaction status updates succeed even if email fails
- ✅ **Configurable SMTP** (Brevo/Sendinblue support)

### UX Enhancements
- ✅ ConfirmDialog component for all destructive actions (delete client, delete condition, delete note, change status)
- ✅ Loading states on all mutations
- ✅ Error handling with user-friendly messages
- ✅ Toast notifications on success/error
- ✅ Professional footer with Lytnex Web branding and copyright information

## API Endpoints

All endpoints require authentication except `/api/health` and `/api/login`.

### Public Endpoints
- `GET /api/health` - Health check

### Authentication
- `POST /api/login` - Login (email + password)
- `POST /api/logout` - Logout
- `GET /api/me` - Current user info

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client (blocked if has transactions)

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `PATCH /api/transactions/:id/status` - Change transaction status (triggers automated email to client)
- `DELETE /api/transactions/:id` - Delete transaction (cascades: conditions, notes, status_histories)

### Conditions
- `POST /api/transactions/:id/conditions` - Add condition to transaction
- `PUT /api/conditions/:id` - Update condition
- `PATCH /api/conditions/:id/complete` - Mark condition as completed
- `DELETE /api/conditions/:id` - Delete condition

### Notes
- `GET /api/transactions/:id/notes` - List transaction notes
- `POST /api/transactions/:id/notes` - Add note to transaction
- `DELETE /api/notes/:id` - Delete note

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard statistics

**Authentication:** All protected endpoints use session-based auth with httpOnly cookies. Multi-tenancy is enforced via `owner_user_id` filtering.

**Automated Emails:** The `PATCH /api/transactions/:id/status` endpoint automatically sends emails to clients when status changes to 'accepted', 'notary', or 'completed'. Email sending is fail-safe and won't block status updates.

## Testing Checklist (E2E)

Follow these steps to verify the complete application workflow:

### 1. Login
- Navigate to `http://localhost:5173`
- Enter credentials: `yanick@crm.local` / `password123`
- Click "Sign in"
- ✅ Should redirect to dashboard

### 2. Dashboard
- View statistics (will show zeros on first run)
- Read "How it works" section
- ✅ Dashboard loads successfully

### 3. Create Client
- Navigate to "Clients" in sidebar
- Click "New Client" button
- Fill in:
  - First Name: `John`
  - Last Name: `Doe`
  - Email: `john.doe@example.com`
  - Cell Phone: `555-1234`
  - Address Line 1: `123 Main St`
  - City: `Montreal`
  - Province/State: `QC`
- Click "Create Client"
- ✅ Client appears in list

### 4. Create Transaction
- Navigate to "Transactions"
- Click "New Transaction"
- Select client: `John Doe`
- Type: `Sale`
- Sale Price: `500000`
- Offer Date: Select today
- Click "Create Transaction"
- ✅ Transaction appears in list
- Click on transaction to view details

### 5. Add Condition
- On transaction detail page, click "Add Condition"
- Title: `Home Inspection`
- Due Date: Select date 3 days from now
- Type: `Inspection`
- Priority: `High`
- Description: `Professional home inspection required`
- Click "Create Condition"
- ✅ Condition appears with red "high" badge and blue "inspection" badge

### 6. Delete Condition (Test ConfirmDialog)
- Click "Delete" button on condition
- ✅ ConfirmDialog appears (red danger variant)
- Click "Delete" to confirm
- ✅ Condition is removed from list (no 404 error)

### 7. Add Note
- Scroll to Notes section
- Type note: `Client requested early closing date`
- Click "Add Note"
- ✅ Note appears with timestamp and author name

### 8. Delete Note (Test ConfirmDialog)
- Click "Delete" on the note
- ✅ ConfirmDialog appears
- Click "Delete" to confirm
- ✅ Note is removed

### 9. Change Transaction Status
- Click "Change Status" button
- Select new status: `Accepted`
- ✅ ConfirmDialog appears (yellow warning variant)
- Click "Change Status" to confirm
- ✅ Status updates, appears in status history
- ✅ Automated email sent to client (check backend console logs)

### 9a. Test Automated Emails (Optional - requires SMTP configuration)
- **Prerequisites**: SMTP credentials configured in `backend/.env`
- Create a transaction with a client that has a valid email address
- Change transaction status to trigger emails:
  - **Status 'accepted'**: Client receives "Offer Accepted" email
  - **Status 'notary'**: Client receives "Deal FIRM" email
  - **Status 'completed'**: Client receives "Closing Completed" email
- ✅ Check backend console logs for `[TransactionAutomation] Email ... envoyé`
- ✅ Check client's email inbox for received emails
- ✅ Verify email content is in French with proper formatting
- **Note**: If SMTP not configured, status change still works (fail-safe)

### 10. Test Client Delete Protection
- Navigate back to Clients
- Click on `John Doe` client
- Click "Delete Client" button
- ✅ ConfirmDialog shows message: "Cannot delete this client because they have 1 transaction(s)"
- ✅ Delete button is visible but action is blocked by backend

### 11. Dashboard Refresh
- Navigate back to Dashboard
- ✅ Statistics updated (should show 1 active transaction)
- Refresh page (F5)
- ✅ Data persists correctly

### 12. Test Delete Transaction (Cleanup Test Data)
- Navigate to the transaction created earlier (`/transactions/1` or similar)
- Verify transaction has conditions and notes
- Click "Delete Transaction" button (red button in top-right)
- ✅ ConfirmDialog appears (red danger variant)
- Read message: "Are you sure you want to delete this transaction? This will permanently remove all conditions, notes, and status history associated with it."
- Click "Delete Transaction" to confirm
- ✅ Redirected to `/transactions` list
- ✅ Transaction no longer appears in list
- ✅ Dashboard statistics updated (no active transactions)

### 13. Test Delete Client (Now Unblocked)
- Navigate to Clients
- Click on `John Doe` client (previously blocked)
- Click "Delete Client" button
- ✅ ConfirmDialog appears
- Click "Delete" to confirm
- ✅ Client deleted successfully (was blocked before, now works because transaction was deleted)
- ✅ Client no longer appears in clients list

**Example Transaction URL for testing:** `http://localhost:5173/transactions/1` (adjust ID as needed)

## Troubleshooting

### "401 Unauthorized" Error
- **Cause**: Session cookie expired or user not seeded
- **Solution**:
  ```powershell
  cd backend
  node ace db:seed
  ```
  Then log in again with `yanick@crm.local` / `password123`

### "Database Connection Refused" Error
- **Cause**: PostgreSQL not running
- **Solution**:
  ```powershell
  # Check if Docker container is running
  docker ps

  # Start container if stopped
  docker compose up -d

  # Verify port 5432 is listening
  netstat -ano | findstr :5432
  ```

### "Port Already in Use" Error
- **Backend (port 3333)**:
  ```powershell
  # Find process using port 3333
  netstat -ano | findstr :3333
  # Kill the process (replace PID with actual process ID)
  taskkill /PID <PID> /F
  ```

- **Frontend (port 5173)**:
  - Vite will automatically use next available port (5174, 5175, etc.)
  - Check console output for actual port number

### Build Errors

**Frontend Build:**
```powershell
cd frontend
npm run build
```
- Expected output: `✓ built in X.XXs` with no TypeScript errors

**Backend Build:**
```powershell
cd backend
npm run build
```
- Expected output: `[success] build completed` with no TypeScript errors

### Clear Database and Reset
```powershell
# Stop and remove containers
docker compose down

# Start fresh
docker compose up -d

# Re-run migrations and seed
cd backend
node ace migration:run
node ace db:seed
```

## Changelog / Release Notes

### MVP++ Part 5: Bilingual Emails & Professional Branding (December 26, 2025)

**Enhanced Communication & Branding:**

#### Bilingual Email Templates
- **All 6 email templates updated** to include both French and English versions
- **Single email format**: French content first, followed by English translation
- **Visual language divider**: Clear separator between FR/EN sections
- **Professional bilingual subjects**: e.g., "🎉 Félicitations ! / Congratulations!"
- **Maintains same triggers**: Status changes to 'accepted', 'notary', 'completed'

#### Lytnex Web Branding
- **Email footer signature**: All automated emails include discrete Lytnex Web footer
  - Text: "Lytnex Web - L'agence qui a développé ce MVP"
  - Link: www.lytnexweb.ca
  - Style: Small gray text (11px), professional appearance
- **Application footer**: Added persistent footer to CRM interface
  - Left side: `© 2025 Yanick.B - Tous droits réservés`
  - Right side: `Conçu par Lytnex Web` (clickable link to www.lytnexweb.ca)
  - Responsive design: Stacks vertically on mobile
  - Sticky positioning: Always visible at bottom of page

#### Technical Implementation
- **Backend (1 file modified):**
  - `backend/app/services/transaction_automation_service.ts` - Added helper methods for bilingual content and footer
- **Frontend (1 file modified):**
  - `frontend/src/components/Layout.tsx` - Added footer component with flexbox layout
- **Accessibility**: Footer links open in new tab with proper `rel` attributes
- **Professional styling**: Consistent with overall CRM design language

**Build Status:**
- ✅ Backend: 0 TypeScript errors
- ✅ Frontend: 0 TypeScript errors
- ✅ Deployed to production (Fly.io)

---

### MVP++ Part 4: Automated Email Notifications (December 26, 2025)

**Professional Client Communication Layer:**

#### Automated Email System
- **Smart email automation** triggered on transaction status changes
- **6 professional bilingual email templates** (French + English) for buyers and sellers
- **Bilingual support**: Each email includes both French and English versions in a single message
- **Professional branding**: Lytnex Web footer signature on all emails
- **TransactionAutomationService** handles email logic and delivery
- **Fail-safe design**: Transaction updates succeed even if email fails

#### Email Triggers & Templates

**Purchase Transactions (Buyers):**
1. **Status 'accepted'** → Email A1: Offer Accepted
   - Congratulations message
   - Condition reminders (financing, inspection)
   - Next steps for buyer
2. **Status 'notary'** → Email A2: Deal FIRM
   - Transaction confirmed
   - Notary preparation steps
   - Insurance, final visit, moving reminders
3. **Status 'completed'** → Email A3: Closing/Keys Delivered
   - Congratulations on new property
   - Thank you message
   - Google review request

**Sale Transactions (Sellers):**
1. **Status 'accepted'** → Email V1: Offer Accepted
   - Good news announcement
   - Buyer's conditional period explained
   - Availability reminders for inspections
2. **Status 'notary'** → Email V2: Deal FIRM
   - Sale confirmed
   - Moving preparation reminders
   - Closing date preparation
3. **Status 'completed'** → Email V3: Sale Completed
   - Congratulations on sale
   - Thank you message
   - Review/referral request

#### Technical Implementation
- **Backend (3 files modified):**
  - `backend/config/mail.ts` - Enabled SMTP authentication
  - `backend/app/services/transaction_automation_service.ts` (NEW) - Email automation service
  - `backend/app/controllers/transactions_controller.ts` - Integrated service in updateStatus()
- **Email Provider:** Brevo/Sendinblue SMTP integration
- **HTML Templates:** Professional, responsive design with branded colors
- **Environment Variables:** SMTP configuration in `.env`
- **Multi-tenant Safe:** Only sends to client.email if exists
- **Logging:** Console logs for email delivery tracking

#### Configuration
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-login@smtp-brevo.com
SMTP_PASSWORD=your-api-key
MAIL_FROM_ADDRESS=notifications@crm-yanick.local
MAIL_FROM_NAME="CRM Yanick"
```

**Build Status:**
- ✅ Backend: 0 TypeScript errors
- ✅ Frontend: No changes required
- ✅ Emails tested with Brevo free tier

---

### MVP++ (December 25, 2025)

**Major Enhancements:**

- **Client Address & Phones** (Feature A)
  - Added 5 address fields: addressLine1, addressLine2, city, provinceState, postalCode
  - Added 3 phone fields: cellPhone, homePhone, workPhone
  - Updated CreateClientModal with organized sections and helpful placeholders
  - Enhanced ClientDetailsPage to display full address and all phone numbers

- **Client Deletion with Protection** (Feature B)
  - Added `DELETE /api/clients/:id` endpoint
  - Backend validates no transactions exist before allowing deletion
  - Frontend "Delete Client" button with ConfirmDialog integration
  - Smart error message shows transaction count if deletion blocked
  - Redirects to clients list after successful deletion

- **Condition Type & Priority** (Feature C)
  - Added condition `type` enum: inspection, financing, appraisal, legal, documents, repairs, other (default: other)
  - Added condition `priority` enum: low, medium, high (default: medium)
  - Updated CreateConditionModal with type and priority dropdowns
  - Added color-coded badges to TransactionDetailPage:
    - Type badge: blue background
    - Priority badges: red (high), yellow (medium), gray (low)

- **Dashboard "How it Works"** (Feature D)
  - Added comprehensive 5-step workflow guide
  - Numbered steps with clear descriptions for each phase
  - Explains: Create Clients → Start Transactions → Manage Conditions → Track Progress → Add Notes

- **UX Improvements**
  - Fixed DELETE condition bug (dialog now stays open until mutation completes)
  - All ConfirmDialog components properly handle loading states
  - Removed debug console.log statements
  - Clean TypeScript builds (0 errors) for frontend and backend

**Bug Fixes & Polish:**
- **Fixed client creation error 500**: Added explicit `columnName` mapping in Client model for snake_case database columns (address_line1, cell_phone, etc.) to work with camelCase properties in TypeScript
- **Edit condition now supports type & priority**: Extended inline condition editing to allow changing type and priority (previously only title, dueDate, and description were editable)
- **Removed all debug logging**: Cleaned up `console.log('[DEBUG] ...')` statements from TransactionDetailPage and CreateConditionModal for production readiness
- **Fixed JSX syntax error**: Corrected parenthesis mismatch in conditions map function

**Database Changes:**
- Migration: `add_address_and_phones_to_clients_table` - 8 new client fields
- Migration: `add_type_and_priority_to_conditions_table` - 2 new condition enum columns

**API Changes:**
- New endpoint: `DELETE /api/clients/:id`
- Updated: Client create/update validators accept new address/phone fields
- Updated: Condition create/update validators accept type and priority fields

**Files Modified:** 18 files (10 backend, 8 frontend)

**Bug Fix Files:**
- `backend/app/models/client.ts` - Added columnName mappings
- `frontend/src/pages/TransactionDetailPage.tsx` - Edit condition with type/priority + removed debug logs
- `frontend/src/components/CreateConditionModal.tsx` - Removed debug logs

**Build Status:**
- ✅ Backend: 0 TypeScript errors
- ✅ Frontend: 0 TypeScript errors
- ✅ All migrations executed successfully

---

### MVP++ Part 2: UX & Business Enhancements (December 25, 2025)

**3 Quick Wins for Professional UX:**

#### 1. **Conditions Summary Stats (Reassuring Overview)**
- Added visual summary block above conditions list on Transaction Detail page
- **Displays:**
  - `X / Y completed` - Progress tracker
  - `Overdue: N` - Red badge if overdue conditions exist
  - `Due soon (7d): M` - Yellow badge for upcoming deadlines
  - `Next due: YYYY-MM-DD` - Closest pending deadline (shows "—" if none)
- **Benefits:** Instant visibility on transaction health without scrolling
- **Implementation:** Pure client-side calculation from existing data (no API calls)
- **File:** `frontend/src/pages/TransactionDetailPage.tsx`

#### 2. **Professional Error Handling + Session Management**
- Replaced generic "Network error. Please try again." messages with actionable feedback
- **New Error Utility:** `frontend/src/utils/apiError.ts`
  - Parses 401/419 → "Session expirée. Merci de vous reconnecter." + auto-redirect
  - Parses 422 validation errors → Field-specific error messages
  - Detects network failures → "Impossible de joindre le serveur. Vérifie que le backend tourne (port 3333)."
- **Error Display:** Title + Message + Field Errors (if applicable) + "Go to Login" button on session expiry
- **Applied to:** CreateClientModal, CreateConditionModal, CreateTransactionModal
- **Benefits:** Users know exactly what went wrong and what to do next

#### 3. **Create Client Modal: Tabs for Better UX**
- Replaced long scrolling form with clean 3-tab interface
- **Tabs:**
  - **Infos de base** - firstName, lastName, email, phone, notes
  - **Adresse** - addressLine1, addressLine2, city, provinceState, postalCode
  - **Téléphones** - cellPhone, homePhone, workPhone
- **Benefits:** Logical grouping, less overwhelming, professional appearance
- **Mobile-friendly:** Tabs stack responsively
- **File:** `frontend/src/components/CreateClientModal.tsx`

**Technical Details:**
- **Files Modified:** 5 frontend files
  - `frontend/src/utils/apiError.ts` (NEW)
  - `frontend/src/pages/TransactionDetailPage.tsx`
  - `frontend/src/components/CreateClientModal.tsx`
  - `frontend/src/components/CreateConditionModal.tsx`
  - `frontend/src/components/CreateTransactionModal.tsx`
- **No Backend Changes:** Pure frontend improvements
- **No New Dependencies:** Uses existing React/TailwindCSS patterns

**Testing Guide (5 minutes):**

1. **Test Conditions Summary Stats**
   - Navigate to any transaction with conditions (`/transactions/:id`)
   - Verify summary block appears above condition list
   - Check: "X / Y completed", Overdue badge (red), Due soon badge (yellow), Next due date
   - Test edge case: Transaction with 0 conditions (should show 0/0, Next due: —)

2. **Test Error Handling**
   - **Session Expiry:** Stop backend, try creating a client → Should show "Impossible de joindre le serveur..."
   - **Validation Error:** Try creating client without firstName → Should show "Champs requis" + clear message
   - **Field Errors:** If backend returns field-specific errors, they should appear in a list

3. **Test Client Modal Tabs**
   - Click "New Client" → Modal opens with 3 tabs (Infos de base, Adresse, Téléphones)
   - Switch between tabs → Fields persist when switching
   - Fill only basic info → Submit → Client created successfully
   - Open modal again → Tab resets to "Infos de base"

**No Regressions:**
- ✅ Condition deletion still works (ConfirmDialog)
- ✅ Note deletion still works
- ✅ Transaction `notesText` vs `notes[]` relation intact
- ✅ All existing features unchanged

**Build Status:**
- ✅ Frontend: 0 TypeScript errors
- ✅ Backend: 0 TypeScript errors

---

### MVP++ Part 3: Delete Transaction Feature (December 25, 2025)

**Critical Data Management Feature:**

#### Delete Transaction with Cascading Cleanup
- **Problem Solved:** Users couldn't delete test data because client deletion was blocked by existing transactions, and no way to delete transactions existed
- **Solution:** Added secure transaction deletion with automatic cleanup

**Features:**
- **Backend Endpoint:** `DELETE /api/transactions/:id`
  - Multi-tenant security: Verifies `owner_user_id` before deletion
  - Returns 404 if transaction not found or doesn't belong to user
  - Returns 204 No Content on success
- **Automatic Cascades:** Deletes all related data via FK constraints:
  - Conditions (`ON DELETE CASCADE`)
  - Notes (`ON DELETE CASCADE`)
  - Transaction Status Histories (`ON DELETE CASCADE`)
- **Frontend UI:**
  - Red "Delete Transaction" button in transaction detail header
  - ConfirmDialog (danger variant) with clear warning message
  - Loading state during deletion
  - Auto-redirect to `/transactions` list after success
  - Query invalidation: transactions, dashboard, client details

**Use Cases:**
1. **Cleanup Test Data:** Delete test transactions to unblock client deletion
2. **Error Correction:** Remove incorrectly created transactions
3. **Data Management:** Clean up old/unwanted transactions

**Files Modified:**
- **Backend (2 files):**
  - `backend/start/routes.ts` - Added DELETE route
  - `backend/app/controllers/transactions_controller.ts` - Implemented destroy() method
- **Frontend (2 files):**
  - `frontend/src/api/transactions.api.ts` - Added delete() method
  - `frontend/src/pages/TransactionDetailPage.tsx` - Added UI + mutation logic

**Security & Data Integrity:**
- ✅ Multi-tenancy enforced (owner_user_id check)
- ✅ Cascading deletes properly configured in DB migrations
- ✅ ConfirmDialog prevents accidental deletions
- ✅ All related data cleaned up (no orphaned records)

**Testing:**
1. Create transaction with conditions and notes
2. Click "Delete Transaction" → ConfirmDialog appears
3. Confirm → Transaction + all dependencies deleted
4. Client deletion now works (was blocked before)

**Build Status:**
- ✅ Frontend: 0 TypeScript errors
- ✅ Backend: 0 TypeScript errors

---

### MVP (December 24-25, 2025)

Initial release with core functionality:
- User authentication (login/logout)
- Client management (create, list, view)
- Transaction management (create, list, view, status changes)
- Condition tracking (create, edit, complete, delete)
- Notes on transactions
- Dashboard with statistics
- Session-based authentication
- PostgreSQL database with Docker setup
- Complete TypeScript type safety
