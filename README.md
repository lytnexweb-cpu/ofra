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

### MVP++ Part 7: Settings Enhancement & Custom Email Signatures (December 26, 2025)

**Professional Profile Management & Personalized Communications:**

#### Settings Page - 5 Comprehensive Tabs
- **Complete redesign** of Settings page from 2 tabs to 5 tabs:
  - 🔒 **Password** - Change password (existing, enhanced)
  - ✉️ **Email** - Change email address (existing, enhanced)
  - 👤 **Profile** - NEW: Professional information (name, phone, agency, license number)
  - ✍️ **Email Signature** - NEW: Custom HTML signature for automated emails
  - 🎨 **Display** - NEW: Language, date format, timezone preferences

#### Profile Information Management
- **New fields in user profile:**
  - Full Name (display name for signatures)
  - Phone Number (contact info)
  - Agency Name (brokerage/company)
  - License Number (real estate license)
  - Profile Photo (base64 or URL - future use)
- **API endpoint:** `PUT /api/me/profile` for updating profile info
- **Validation:** All fields optional, flexible updates
- **No password required** for profile updates (only for email changes)

#### Custom Email Signatures
- **Personalized email signatures** for all automated client communications
- **HTML support:** Full HTML formatting in signature textarea
- **Automatic integration:** Signature used in all 6 automated emails (3 buyer, 3 seller)
- **Fallback behavior:** If no custom signature, uses default "Yanick - Real Estate Agent"
- **Dynamic name:** Default signature uses user's full name if set
- **Professional example provided** in placeholder text

#### Display Preferences
- **Language selection:** French (fr) / English (en) - ready for future i18n
- **Date format options:** DD/MM/YYYY or MM/DD/YYYY
- **Timezone support:** 6 Canadian zones (Toronto, Vancouver, Montreal, Calgary, Halifax, Regina)
- **Stored preferences** ready for UI localization in future updates

#### TransactionAutomationService - Signature Integration
- **New method:** `getSignature(user, language)` generates personalized signatures
- **Smart fallback:** Custom signature → user's name → default "Yanick"
- **All 6 email templates updated** to use dynamic signatures
- **Bilingual support:** Separate signatures for French and English sections
- **Owner loading:** Transaction owner preloaded for signature access

#### Technical Implementation
- **Database Migration:** Added 8 fields to `users` table
  - `phone`, `agency`, `license_number`, `profile_photo`
  - `email_signature` (TEXT)
  - `language` (default: 'fr'), `date_format` (default: 'DD/MM/YYYY'), `timezone` (default: 'America/Toronto')
- **Backend (6 files modified):**
  - `database/migrations/1766780093948_create_add_profile_and_preferences_to_users_table.ts` (NEW)
  - `app/models/user.ts` - Added 8 new columns
  - `app/validators/profile_validator.ts` - Added `updateProfileInfoValidator`
  - `app/controllers/profile_controller.ts` - Added `updateProfileInfo()` method
  - `start/routes.ts` - Added `PUT /api/me/profile` route
  - `app/services/transaction_automation_service.ts` - Integrated custom signatures
- **Frontend (3 files modified):**
  - `api/auth.api.ts` - Updated User interface with 8 new fields
  - `api/profile.api.ts` - Added UpdateProfileInfoRequest interface and API method
  - `pages/SettingsPage.tsx` - Complete rewrite with 5 tabs (433 lines)

#### User Experience
- **Tab-based navigation:** Clean, organized interface for settings
- **Responsive design:** Tabs scroll horizontally on mobile
- **Form state management:** Separate state for each settings section
- **Success messages:** Auto-clear after 3 seconds
- **Query invalidation:** Automatic data refresh after updates
- **Professional layout:** Consistent with CRM design language

**Build Status:**
- ✅ Backend: 0 TypeScript errors, migration successful
- ✅ Frontend: 0 TypeScript errors, 113 modules transformed

**Files Modified:**
- Backend: 6 files (1 migration, 5 core files)
- Frontend: 3 files

**How It Works:**
1. User updates email signature in Settings → Email Signature tab
2. Custom signature saved to `users.email_signature` column
3. When transaction status changes, TransactionAutomationService loads owner
4. Email templates use `getSignature(owner, 'en')` or `getSignature(owner, 'fr')`
5. If custom signature exists, it's used; otherwise, default with user's name
6. All 6 automated emails now include personalized signatures

---

### MVP++ Part 6: Yanick Workflow Customization (December 26, 2025)

**Workflow Alignment & Bug Fixes:**

#### Condition Types - Yanick's Workflow
- **Added 3 new condition types** to match real estate requirements:
  - `deposit` - Buyer deposit tracking
  - `water_test` - Water quality test for properties
  - `rpds_review` - RPDS (Real Property Report) review
- **Reordered condition types** by priority: financing, deposit, inspection, water_test, rpds_review, appraisal, legal, documents, repairs, other
- **Default condition type changed** to `financing` (most common)
- **Updated condition dropdowns** in CreateConditionModal and TransactionDetailPage

#### Transaction Status Labels - Clearer Workflow
- **Renamed status labels** for better clarity:
  - `offer` → "Offer Submitted"
  - `accepted` → "Offer Accepted"
  - `conditions` → "Conditional Period"
  - `notary` → "Firm" (matches real estate terminology)
- **Workflow alignment**: Labels now match Yanick's email workflow requirements
- **Email triggers verified**: 3 emails per transaction type (buyer/seller) at correct statuses

#### Critical Bug Fixes
- **Fixed condition creation (500 error)**:
  - Problem: New condition types not in database enum
  - Solution: Created migration to add deposit, water_test, rpds_review to database
  - Migration executed successfully
- **Fixed note deletion (not working)**:
  - Problem: JOIN query returned composite object that couldn't be deleted
  - Solution: Simplified to two separate queries (find note → verify ownership → delete)
  - Backend controller refactored for reliability

**Files Modified:**
- **Backend (4 files):**
  - `app/models/condition.ts` - Added 3 new condition types
  - `app/validators/condition_validator.ts` - Updated type enum
  - `app/controllers/notes_controller.ts` - Fixed destroy() method
  - `database/migrations/1766776955384_create_add_condition_types_for_yanick_workflows_table.ts` (NEW)
- **Frontend (4 files):**
  - `api/conditions.api.ts` - Updated ConditionType enum
  - `components/CreateConditionModal.tsx` - New types in dropdown + default to financing
  - `pages/TransactionDetailPage.tsx` - Updated status labels + condition type dropdown
  - `pages/TransactionsPage.tsx` - Updated status labels for consistency

**Build Status:**
- ✅ Backend: 0 TypeScript errors, migration successful
- ✅ Frontend: 0 TypeScript errors, 113 modules transformed

---

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

---

## Phase 2 - Planned Features

Based on Yanick's workflow requirements email (December 2, 2025), the following features are planned for future implementation:

### 🔴 Critical Features (High Priority)

#### 1. Internal Automations & Reminders System
**Purpose:** Automated task reminders for Yanick to ensure no critical steps are missed.

**Requirements:**
- **Database:**
  - New `reminders` table with: id, transaction_id, type, title, description, status, due_date, completed_at
  - Types: 'fintrac', 'birthday', 'google_review', 'social_post', 'custom'
  - Status: 'pending', 'completed'
- **Automatic Triggers:**
  - When transaction status → `firm` (notary): Create reminder "Complete FINTRAC"
  - When FINTRAC completed: Create reminder "Record client birthday in Follow Up Boss"
  - When transaction status → `completed`: Create reminder "Request Google review from client"
  - When condition financing/inspection changes: Create follow-up reminder
- **Dashboard Widget:**
  - "My Reminders" section showing active reminders sorted by due date
  - Mark as done functionality
  - Badge in navigation showing number of pending reminders
- **Social Media Reminders:**
  - Auto-create reminder for social posts at milestones: Offer Accepted, Deal FIRM, Closing Day

**Estimated Complexity:** Medium (3-4 hours)
- Backend: Model + Service + Hooks
- Frontend: Dashboard widget + API integration

---

#### 2. Client Onboarding Form
**Purpose:** Professional form to collect client information including FINTRAC-required details.

**Requirements:**
- **Public Form Page** (unauthenticated route):
  - `/onboarding/:token` - Secure tokenized link sent to clients
  - Form fields:
    - Full name(s) (both spouses if applicable)
    - Email + Phone
    - Property address (if known)
    - **FINTRAC Information:**
      - ID type (Driver's License, Passport, etc.)
      - ID number
      - Date of birth
      - Occupation
    - Basic property info (type, estimated price)
    - Additional notes/questions
- **Form Submission Flow:**
  1. Client fills out form
  2. Data sent to Yanick via email notification
  3. Client profile auto-created in CRM (status: 'pending_review')
  4. Yanick reviews data and manually adds to Follow Up Boss
  5. Transaction can be started directly from the onboarded client
- **Security:**
  - Token-based access (expires after 7 days)
  - Rate limiting to prevent spam
  - Optional CAPTCHA for public form

**Estimated Complexity:** Medium-High (4-5 hours)
- Backend: Public routes, token generation, email notification
- Frontend: Multi-step form component, validation, submission handling

---

### 🟡 Important Features (Medium Priority)

#### 3. Condition Deadline Alerts
**Purpose:** Visual alerts and notifications when condition deadlines approach.

**Requirements:**
- **Visual Indicators:**
  - Dashboard: "Conditions at risk" section showing conditions due in next 2 days
  - Transaction detail: Red pulsing border on conditions overdue > 2 days
  - Automatic email to Yanick if condition overdue by 3+ days
- **Notification System:**
  - Daily digest email at 8 AM listing conditions due today
  - Option to snooze reminders for specific conditions
- **Dashboard Summary:**
  - "Action Required" widget with conditions grouped by urgency

**Estimated Complexity:** Low-Medium (2-3 hours)
- Backend: Email service for daily digest
- Frontend: Enhanced visual indicators, dashboard widget

---

#### 4. Social Media Reminder System
**Purpose:** Suggest social media posts for key transaction milestones.

**Requirements:**
- **Auto-Generated Reminders:**
  - Offer Accepted: "Great news! Just helped [Client] with their [purchase/sale]!"
  - Deal FIRM: "Another successful transaction going FIRM! 🎉"
  - Closing Day: "Congratulations to [Client] on their new home!"
- **Dashboard Widget:**
  - "Posts to Share" section with pre-written copy
  - Copy-to-clipboard button
  - Mark as posted
  - Track which posts were shared
- **Customization:**
  - Edit suggested post copy
  - Add photo placeholder reminder
  - Link to Facebook/Instagram (opens pre-filled post if possible)

**Estimated Complexity:** Low-Medium (2-3 hours)
- Backend: Reminder creation logic
- Frontend: Dashboard widget with copy-to-clipboard

---

### 🟢 Nice-to-Have Features (Low Priority)

#### 5. Enhanced Transaction Workflow
**Purpose:** More granular transaction status tracking.

**Potential Additions:**
- `pre_closing_tasks` status: Between `firm` and `closing`
- `post_closing_followup` status: After `completed`
- Checklist for pre-closing tasks (final walkthrough, insurance, utilities, etc.)
- Post-closing checklist (review request sent, birthday recorded, referrals collected)

**Estimated Complexity:** Low (1-2 hours)
- Backend: Add statuses, migration
- Frontend: Update status dropdowns, add checklists

---

#### 6. Client Portal (Optional)
**Purpose:** Allow clients to view their transaction status.

**Requirements:**
- Public client view (token-based authentication)
- Read-only transaction details
- Condition checklist with completion status
- Upcoming deadlines
- Document sharing (optional)

**Estimated Complexity:** High (6-8 hours)
- Backend: Token generation, public API endpoints
- Frontend: Separate client-facing UI

---

### Implementation Priority Order

**Phase 2A (Next Sprint):**
1. Internal Reminders System (Critical)
2. Client Onboarding Form (Critical)

**Phase 2B (Future Sprint):**
3. Condition Deadline Alerts
4. Social Media Reminders

**Phase 2C (Nice-to-Have):**
5. Enhanced Transaction Workflow
6. Client Portal (if needed)

**Total Estimated Time:** 15-20 hours of development for all Phase 2 features

---

### Notes on Implementation

- **Phase 2A** addresses the most critical workflow gaps mentioned in Yanick's email
- **Internal Reminders** are essential to prevent missed FINTRAC filings and follow-ups
- **Onboarding Form** professionalizes client intake and ensures FINTRAC compliance
- **Phase 2B/2C** features enhance UX but aren't blocking daily operations
- All features will follow existing architecture patterns (AdonisJS + React + PostgreSQL)
- Backward compatibility maintained - existing data unaffected
