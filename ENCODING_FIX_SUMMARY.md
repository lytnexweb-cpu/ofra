# Encoding Fix Summary

**Date:** 2026-01-15
**Issue:** ?? characters in git diff (UTF-8 display problem on Windows)
**Solution:** UTF-8 everywhere + LF line endings

## Files Created/Modified

- `.gitattributes` - Forces text=auto eol=lf for all text files
- `FIX_ENCODING.md` - Fix documentation
- `ENCODING_FIX_SUMMARY.md` - This file

## Git Config Applied

```
core.quotepath=false
i18n.commitEncoding=utf-8
i18n.logOutputEncoding=utf-8
core.autocrlf=false
```

## Commands Executed

```bash
git config --local core.quotepath false
git config --local i18n.commitEncoding utf-8
git config --local i18n.logOutputEncoding utf-8
git config --local core.autocrlf false
git add .gitattributes FIX_ENCODING.md ENCODING_FIX_SUMMARY.md
git add --renormalize .
git commit -m "chore: enforce UTF-8 encoding and LF line endings"
```

## Verification

```powershell
git diff HEAD~1 | findstr "??"        # Should return nothing
git show HEAD | Select-String "🔒"     # Should display correctly
```

## Impact

- All text files normalized to LF
- UTF-8 characters preserved
- Cross-platform compatible
- No code changes (only line endings)
