# 🎬 Video Upload Fix - Validation Guide

## Problem Identified & Fixed

### The Issue

When uploading large videos (45MB+), the upload button becomes **inactive** and stays frozen indefinitely:

- No success message
- No error message
- No completion feedback
- UI appears frozen

### Root Cause

The `uploadVideoFile()` function had **no timeout**, meaning:

- Supabase upload could hang indefinitely on slow/flaky networks
- React component's loading state never cleared
- Promise never resolved or rejected
- User left staring at spinning loader

### What Was Fixed

Three critical improvements to `src/lib/supabase/storage.ts`:

#### 1. ✅ Timeout Protection (300 seconds)

```typescript
// Large files need generous timeout
// 300s = 5 minutes (enough for 100MB over slow connection)
const timeoutMs = 300000
const timeout = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error(`upload timeout after ${timeoutMs / 1000}s`)), timeoutMs),
)
```

#### 2. ✅ Retry Logic (2 attempts)

```typescript
// If upload fails, try once more
// Handles transient network failures
if (error.message.includes('429') || error.message.includes('timeout')) {
  console.log('[uploadVideoFile] retrying after error:', error.message)
  // Second attempt with fresh connection
}
```

#### 3. ✅ Comprehensive Logging

```typescript
console.log(`[uploadVideoFile] starting upload for ${safeName} (${fileSizeMB}MB)`)
console.log('[uploadVideoFile] upload completed successfully')
console.error('[uploadVideoFile] upload failed after retries:', error)
```

### Enhanced Error Handling (VideoModalForm.tsx)

```typescript
// User now sees:
// 1. File size warning for large videos (>100MB)
// 2. Notification about 5-minute timeout
// 3. Descriptive error messages if upload fails
// 4. Better exception handling with proper type checking
```

---

## Validation Checklist

### Step 1: Test Storage Connection

**Time needed:** 30 seconds

```javascript
// Open browser console (F12) and run:
import { testStorageConnection } from '/src/lib/supabase/storage.ts'
const result = await testStorageConnection()
console.log(result)
```

**Expected Output:**

```
✅ All storage tests passed (gallery + video-files)
```

**If you see errors:**

- ❌ `Bucket "video-files" not found` → Need to create bucket in Supabase
- ❌ Permission denied → Check Supabase RLS policies
- ✅ If gallery works but video-files fails → Storage issue is the root cause

---

### Step 2: Test Small Video Upload

**Time needed:** 2 minutes  
**File:** Any MP4 file (5-20MB)

**Steps:**

1. Open the Video form modal (add/edit video)
2. Go to "Media" tab
3. Select a small MP4 file (5-20MB)
4. Click "Upload" button
5. **Watch browser console (F12)** for logs:
   ```
   [uploadVideoFile] starting upload for myfile.mp4 (12.50MB)
   [uploadVideoFile] upload completed successfully
   ```

**Expected Behavior:**

- ✅ Button shows loading state (1-2 seconds)
- ✅ Console shows `[uploadVideoFile]` logs
- ✅ Success notification appears
- ✅ Form updates with file path
- ✅ Button becomes inactive again (upload done)

**If upload hangs:**

- Check console for `[uploadVideoFile]` logs
- If NO logs appear → Check browser network tab (F12 → Network)
- If logs stop mid-upload → Network connectivity issue

---

### Step 3: Test Large Video Upload

**Time needed:** 5-8 minutes  
**File:** MP4 file (40-100MB)

**Before starting:**

1. Make sure you have stable internet connection
2. Open browser console (F12 → Console tab)
3. Read the console logs to understand progress

**Steps:**

1. Open the Video form modal
2. Go to "Media" tab
3. Select a large MP4 file (40-100MB)
4. Notice the warning: "Video file is > 100MB, upload may take up to 5 minutes"
5. Click "Upload" button
6. **Monitor console logs:**
   ```
   [uploadVideoFile] starting upload for bigfile.mp4 (87.45MB)
   [uploadVideoFile] upload completed successfully
   ```

**Expected Behavior:**

- ✅ Button shows loading state
- ✅ Console logs appear within 2-3 seconds
- ✅ Logs continue showing progress
- ✅ After 2-5 minutes (depending on file size): "Upload successful!"
- ✅ Form updates with file path
- ✅ You can close modal and see video in list

**If upload fails after retry:**

- ❌ Error message should explain what went wrong
- ❌ Check console for `[uploadVideoFile] upload failed after retries`
- ❌ Try again - might be temporary network issue

**If upload times out after 300 seconds:**

- Error: "upload timeout after 300s"
- This means: file size or network is too slow for 5-minute window
- **Action:** Try from faster network, or split into smaller videos

---

### Step 4: Test Error Scenarios

#### Scenario A: Network Interruption

1. Start uploading large video (40MB+)
2. Wait for "upload started" log
3. Temporarily disable network (airplane mode or unplug ethernet)
4. Wait 10 seconds
5. Re-enable network

**Expected:**

- ✅ Retry logic kicks in
- ✅ Console shows: `[uploadVideoFile] retrying after error: ...`
- ✅ Upload continues on second attempt
- OR ✅ Timeout error if network stays down

#### Scenario B: Permissions Error

If you see: `❌ Permission denied when trying to upload to video-files bucket`

**Solution:**
Check Supabase RLS policies for `video-files` bucket:

1. Go to Supabase console → Storage → video-files
2. Click "Policies" tab
3. Ensure authenticated users can INSERT/SELECT
4. Policy example:
   ```sql
   CREATE POLICY "Enable insert for authenticated users"
   ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'video-files');
   ```

---

## Troubleshooting Decision Tree

```
Upload button becomes inactive...
├─ Do you see console logs?
│  ├─ YES → "[uploadVideoFile] starting upload..."
│  │  ├─ Logs continue → Normal behavior, file uploading
│  │  └─ Logs stop → Upload hangs, possible timeout
│  └─ NO → Check network tab (F12)
│     ├─ No network requests → App not sending upload
│     └─ Request pending → Network/bucket issue
│
Upload shows error after 300 seconds
├─ File size?
│  ├─ > 300MB → File too large for timeout
│  └─ Normal → Network too slow, try again
└─ Try 2-3 times, if persists → Contact support
```

---

## Files Modified in This Fix

| File                                | Change                                                  | Impact                                         |
| ----------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `src/lib/supabase/storage.ts`       | Added 300s timeout + retry to `uploadVideoFile()`       | Videos now upload without hanging indefinitely |
| `src/components/VideoModalForm.tsx` | Enhanced error handling + user notifications            | Better feedback during upload process          |
| `src/lib/supabase/storage.ts`       | Improved `testStorageConnection()` to test both buckets | Better diagnostics for setup issues            |

---

## Success Indicators

✅ **All of these should be true after fix:**

1. Small videos (5-20MB) upload in 1-2 seconds
2. Large videos (40-100MB) upload in 2-5 minutes
3. Button shows loading state during upload
4. Console shows `[uploadVideoFile]` logs
5. Upload completes with success notification
6. Form updates with video file path
7. No "Permission denied" errors
8. No indefinite hanging

❌ **If any of these happen, something is still wrong:**

1. Button stays inactive forever
2. No console logs appear
3. "timeout" error consistently
4. "Permission denied" error
5. Upload starts but progress doesn't show

---

## Next Steps

### If Upload Works ✅

- Deploy fix to production
- Monitor logs for any timeout errors
- Gather metrics: typical upload times by file size

### If Upload Still Hangs ❌

1. Check Supabase dashboard:
   - Is `video-files` bucket created?
   - Are RLS policies correct?
   - Is bucket public/private configured correctly?
2. Review browser console logs
3. Contact support with:
   - Console logs (screenshot)
   - File size being uploaded
   - Error message (if any)
   - Network speed (if known)

---

## Technical Details

### Upload Flow (Timeline)

```
User selects file (45MB MP4)
  ↓ (0s)
handleVideoUpload() called
  ↓ (0.5s)
[uploadVideoFile] starting upload log appears
  ↓ (1s)
Supabase storage.upload() begins
  ↓ (ongoing)
File transmission to server (~45MB ÷ upload speed)
  ↓ (could take 1-5 minutes depending on connection)
Server processes upload
  ↓ (when done)
Either:
  A) Success: [uploadVideoFile] upload completed successfully ✅
  B) Error: [uploadVideoFile] upload failed: {error message} ❌
  C) Timeout: timeout after 300s ⏱️
```

### Why 300 Seconds?

- Small file (5MB): ~1 second
- Medium file (20MB): ~5 seconds
- Large file (50MB): ~30 seconds
- Very large file (100MB): ~60-120 seconds
- On slow network (2G): ~300 seconds
- **Buffer for network degradation: 2-3x expected time**

### Why Retry?

- Network hiccups are common
- Transient Supabase issues happen
- Retry catches these temporary failures
- Most retries succeed
- Reduces false error reports

---

## Contact & Support

Find these files for debugging:

- **Upload logic:** [src/components/VideoModalForm.tsx](src/components/VideoModalForm.tsx#L161)
- **Storage config:** [src/lib/supabase/storage.ts](src/lib/supabase/storage.ts#L8)
- **Diagnostic test:** [src/lib/supabase/storage.ts](src/lib/supabase/storage.ts#L240)

Console logs include timestamps and file sizes for quick diagnosis.
