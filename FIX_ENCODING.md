# UTF-8 Encoding Fix

## Problem
UTF-8 characters (emojis, accents, arrows) appeared as ?? or ???? in `git diff` on Windows.

## Solution Applied

1. **Git Configuration (local repo)**
   ```bash
   core.quotepath=false
   i18n.commitEncoding=utf-8
   i18n.logOutputEncoding=utf-8
   core.autocrlf=false
   ```

2. **`.gitattributes`**
   - Forces LF line endings for all text files
   - Normalizes encoding across platforms
   - Marks binary files explicitly

3. **PowerShell UTF-8** (temporary session)
   ```powershell
   chcp 65001
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   ```

## Files with UTF-8 Characters

- `frontend/src/pages/TransactionDetailPage.tsx` - 🔒 ✅ 💡 📍
- `frontend/src/components/*.tsx` - Accents in French text
- `backend/app/controllers/transactions_controller.ts` - Uses ASCII `->` (safe)

## Verification

```powershell
# Should return nothing
git diff HEAD~1 | findstr "??"

# Should display emoji correctly
git show HEAD:frontend/src/pages/TransactionDetailPage.tsx | Select-String "🔒"
```

## Result

✅ UTF-8 characters display correctly in git diff
✅ Cross-platform line endings (LF)
✅ No ?? in diffs
