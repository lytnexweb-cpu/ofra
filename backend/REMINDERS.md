# Ofra Reminders System

This document explains how to configure and run the proactive reminder system for Ofra CRM.

## Overview

The reminder system sends automated emails to agents about their pending conditions:

- **Daily Digest** (08:00 local time): Summary of overdue + due within 7 days
- **48h Reminder**: Individual reminder 48 hours before due date
- **Overdue Reminder**: Daily reminder for overdue conditions

## Requirements

### Environment Variables

Add these to your `.env` file:

```bash
# Email configuration (required)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-email@smtp-brevo.com
SMTP_PASSWORD=your-api-key
MAIL_FROM_ADDRESS=notifications@yourdomain.com
MAIL_FROM_NAME=Ofra

# Frontend URL for email links
FRONTEND_URL=https://ofra.pages.dev

# Timezone for scheduling (default: UTC)
TZ=America/Moncton
```

### Database Migration

Run the migration to create the `reminder_logs` table:

```bash
node ace migration:run
```

## Running the Command

### Manual Execution

```bash
# Production run
node ace ofra:reminders:send

# Dry-run mode (no emails sent)
node ace ofra:reminders:send --dry-run
```

### Expected Output

```
============================================================
📧 Ofra Reminder Service - 2026-01-25 08:00:00 AST
============================================================

✅ Reminder Processing Complete
   Duration: 2.3s
   Digests sent: 5
   48h reminders sent: 3
   Overdue reminders sent: 7
   Total emails: 15
============================================================
```

## Scheduling with Cron

### Linux/macOS

Add to crontab (`crontab -e`):

```bash
# Run daily at 08:00 local time
0 8 * * * cd /path/to/crm-yanick/backend && TZ=America/Moncton node ace ofra:reminders:send >> /var/log/ofra-reminders.log 2>&1
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 08:00
4. Action: Start a program
   - Program: `node`
   - Arguments: `ace ofra:reminders:send`
   - Start in: `C:\path\to\crm-yanick\backend`

### Fly.io (Production)

Add to your `fly.toml`:

```toml
[processes]
  app = "node build/bin/server.js"

# Schedule reminder cron job
[[services]]
  internal_port = 8080
  protocol = "tcp"

# Run reminders via Fly machines scheduled task
# See: https://fly.io/docs/apps/scheduled-tasks/
```

Or use Fly.io Machines with scheduled tasks:

```bash
flyctl machine run . --schedule "0 8 * * *" --command "node ace ofra:reminders:send"
```

## How It Works

### Deduplication

The system uses the `reminder_logs` table to prevent duplicate emails:

- Each reminder is logged with: `(owner_user_id, type, entity_type, entity_id, sent_on)`
- Before sending, the system checks if a reminder was already sent today
- Unique constraint prevents race conditions

### Multi-tenancy

- All queries filter by `owner_user_id`
- Each agent receives their own personalized reminders
- No data leakage between agents

### Condition Selection

| Type | Criteria |
|------|----------|
| Overdue | `status = 'pending'` AND `due_date < today` |
| Due Soon | `status = 'pending'` AND `due_date <= today + 7 days` |
| 48h | `status = 'pending'` AND `due_date` within 48 hours |

**Note:** Completed conditions (`status = 'completed'`) are always ignored.

## Testing

Run the reminder tests:

```bash
# All tests
node ace test

# Reminder tests only
node ace test --files="tests/functional/reminders.spec.ts"
```

Tests cover:
- Idempotence (no duplicate emails)
- Correct condition selection
- Multi-tenant isolation
- Completed conditions ignored

## Troubleshooting

### Emails not sending

1. Check SMTP credentials in `.env`
2. Verify `MAIL_FROM_ADDRESS` is authorized in your SMTP provider
3. Check logs for error messages

### Duplicate emails

This should not happen due to the unique constraint. If it does:

1. Check if the cron is running multiple times
2. Verify the `reminder_logs` table has the unique constraint

### Wrong timezone

Set the `TZ` environment variable:

```bash
TZ=America/Moncton node ace ofra:reminders:send
```
