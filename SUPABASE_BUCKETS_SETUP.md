# 🪣 Supabase Buckets Setup Guide

## Overview

All storage buckets are now **centrally configured** via environment variables in `.env`. This ensures:

- ✅ Configuration consistency across environments
- ✅ Easy bucket renames without code changes
- ✅ Clear audit trail of bucket names
- ✅ Type-safe bucket references in code

---

## Current Bucket Configuration

### `.env` Configuration

```env
VITE_BUCKET_AVATAR="avatars"
VITE_BUCKET_GALLERY="gallery"
VITE_BUCKET_PUBLIC="videos"
VITE_BUCKET_VIDEO_FILES="video-files"
VITE_BUCKET_DIRECTORY_IMAGES="directory-images"
VITE_BUCKET_PAROISSE_FILES="paroisse-files"
```

### Supabase Console Status

| Bucket Name        | Type   | Purpose                     | Status   |
| ------------------ | ------ | --------------------------- | -------- |
| `avatars`          | Public | User profile pictures       | ✅ Ready |
| `gallery`          | Public | Gallery images              | ✅ Ready |
| `videos`           | Public | Video thumbnails            | ✅ Ready |
| `video-files`      | Public | Video uploads (45-100MB)    | ✅ Ready |
| `directory-images` | Public | Directory/About page images | ✅ Ready |
| `paroisse-files`   | Public | Parish documents/files      | ✅ Ready |

---

## How to Access Buckets in Code

### ✅ Correct Way (Using STORAGE_BUCKETS)

```typescript
import { STORAGE_BUCKETS } from '@/lib/supabase/storage'

// Upload to gallery
const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.GALLERY).upload('path', file)

// Upload video
const { data, error } = await supabase.storage
  .from(STORAGE_BUCKETS.VIDEO_FILES)
  .upload('path', file)

// Upload directory image
const { data, error } = await supabase.storage
  .from(STORAGE_BUCKETS.DIRECTORY_IMAGES)
  .upload('path', file)
```

### ❌ Old Way (Hardcoded Names - DON'T USE)

```typescript
// ❌ WRONG - Don't do this
const { data, error } = await supabase.storage
  .from('video-files') // Hardcoded!
  .upload('path', file)
```

---

## STORAGE_BUCKETS Object Reference

Located in `src/lib/supabase/storage.ts`:

```typescript
export const STORAGE_BUCKETS = {
  GALLERY: (import.meta.env.VITE_BUCKET_GALLERY as string) || 'gallery',
  VIDEO_FILES: (import.meta.env.VITE_BUCKET_VIDEO_FILES as string) || 'video-files',
  VIDEOS: (import.meta.env.VITE_BUCKET_PUBLIC as string) || 'videos',
  DIRECTORY_IMAGES: (import.meta.env.VITE_BUCKET_DIRECTORY_IMAGES as string) || 'directory-images',
  PAROISSE_FILES: (import.meta.env.VITE_BUCKET_PAROISSE_FILES as string) || 'paroisse-files',
  AVATARS: (import.meta.env.VITE_BUCKET_AVATAR as string) || 'avatars',
}
```

**Key Features:**

- Falls back to default names if env var is missing
- Reads from `.env` at build time (Vite)
- Logs on initialization for debugging
- Used throughout storage operations

---

## Bucket Usage by Feature

### 💾 Video Upload

**Bucket:** `video-files`
**Env Var:** `VITE_BUCKET_VIDEO_FILES`
**Function:** `uploadVideoFile()`
**Size Limit:** 50MB (configurable)
**Timeout:** 300s (5 minutes)
**Config:**

```env
VITE_BUCKET_VIDEO_FILES="video-files"
```

### 🖼️ Gallery Images

**Bucket:** `gallery`
**Env Var:** `VITE_BUCKET_GALLERY`
**Function:** `uploadFile()`
**Size Limit:** 50MB
**Timeout:** 60s
**Config:**

```env
VITE_BUCKET_GALLERY="gallery"
```

### 📺 Video Thumbnails

**Bucket:** `videos`
**Env Var:** `VITE_BUCKET_PUBLIC`
**Function:** `uploadThumbnailFile()`
**Size Limit:** 50MB
**Config:**

```env
VITE_BUCKET_PUBLIC="videos"
```

### 🏘️ Directory Images

**Bucket:** `directory-images`
**Env Var:** `VITE_BUCKET_DIRECTORY_IMAGES`
**Function:** `uploadDirectoryImage()`
**Size Limit:** 50MB
**Timeout:** 60s
**Config:**

```env
VITE_BUCKET_DIRECTORY_IMAGES="directory-images"
```

### 👤 Avatars

**Bucket:** `avatars`
**Env Var:** `VITE_BUCKET_AVATAR`
**Size Limit:** 50MB
**Config:**

```env
VITE_BUCKET_AVATAR="avatars"
```

### 📄 Parish Files

**Bucket:** `paroisse-files`
**Env Var:** `VITE_BUCKET_PAROISSE_FILES`
**Size Limit:** 50MB
**Config:**

```env
VITE_BUCKET_PAROISSE_FILES="paroisse-files"
```

---

## Setting Up in Supabase Console

### Step 1: Create Buckets

1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
2. Click **Create Bucket** for each bucket name above
3. Set to **Public** for all (since they're publicly accessible)
4. Optional: Set size limit to 50MB per file

### Step 2: Configure RLS Policies

For each bucket, ensure authenticated users can:

- **SELECT** (read/download files)
- **INSERT** (upload new files)
- **UPDATE** (optional for video uploads)

Example policy for `video-files` bucket:

```sql
-- Allow authenticated users to upload to video-files
CREATE POLICY "Enable insert for authenticated users"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-files');

-- Allow public to read
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'video-files');
```

### Step 3: Configure Size Limits

1. Go to each bucket → **Settings**
2. Set **File size limit** to 50MB
3. Optional: Add file type restrictions

---

## Validating Bucket Setup

### Test via Browser Console

```javascript
import { testStorageConnection } from '@/lib/supabase/storage'

// Run this to validate all buckets are accessible
const result = await testStorageConnection()
console.log(result)

// Expected output:
// { ok: true, message: '✅ All storage tests passed (gallery + video-files)' }
```

### Check Logs

On app startup, you should see:

```
[storage.ts] Initialized STORAGE_BUCKETS: {
  GALLERY: "gallery",
  VIDEO_FILES: "video-files",
  VIDEOS: "videos",
  DIRECTORY_IMAGES: "directory-images",
  PAROISSE_FILES: "paroisse-files",
  AVATARS: "avatars"
}
```

---

## Environment Variables Checklist

Before deployment, verify `.env` has all buckets:

```bash
✅ VITE_SUPABASE_PROJECT_ID
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_URL
✅ SUPABASE_ROLE_KEY
✅ VITE_BUCKET_AVATAR
✅ VITE_BUCKET_GALLERY
✅ VITE_BUCKET_PUBLIC
✅ VITE_BUCKET_VIDEO_FILES
✅ VITE_BUCKET_DIRECTORY_IMAGES
✅ VITE_BUCKET_PAROISSE_FILES
```

---

## Troubleshooting

### Issue: "Bucket 'X' not found" error

**Solution:**

1. Check `.env` has correct bucket name
2. Verify bucket exists in Supabase console
3. Check bucket is **Public** (not Private)
4. Run `testStorageConnection()` in console

### Issue: "Permission denied" when uploading

**Solution:**

1. Verify user is authenticated (check login)
2. Check RLS policies allow INSERT for the bucket
3. Ensure bucket is Public (not Private)
4. Check user has auth token (Session valid)

### Issue: Upload timeouts

**Solution:**

1. Video uploads: Timeout is 300s - check file size < 100MB
2. Image uploads: Timeout is 60s - check file size < 50MB
3. Check network connection
4. Try retry - transient failures are retried automatically

### Issue: Wrong bucket being used

**Solution:**

1. Check `.env` has correct bucket name
2. Verify `STORAGE_BUCKETS.XXX` constant is being used
3. Check logs show correct bucket name
4. Rebuild app: `npm run build` (Vite needs rebuild for env changes)

---

## Adding a New Bucket

### Step 1: Add to `.env`

```env
VITE_BUCKET_NEW_FEATURE="new-feature-bucket"
```

### Step 2: Update STORAGE_BUCKETS in storage.ts

```typescript
export const STORAGE_BUCKETS = {
  // ... existing buckets
  NEW_FEATURE: (import.meta.env.VITE_BUCKET_NEW_FEATURE as string) || 'new-feature-bucket',
}
```

### Step 3: Create Bucket in Supabase

1. Supabase Dashboard → Storage → Create Bucket
2. Name: `new-feature-bucket`
3. Set to Public
4. Configure RLS policies

### Step 4: Use in Code

```typescript
import { STORAGE_BUCKETS } from '@/lib/supabase/storage'

await supabase.storage.from(STORAGE_BUCKETS.NEW_FEATURE).upload(path, file)
```

---

## Files Modified for Bucket Configuration

| File                          | Change                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `.env`                        | Added VITE*BUCKET*\* variables for all buckets              |
| `src/lib/supabase/storage.ts` | Created STORAGE_BUCKETS object, updated all hardcoded names |
| Various components            | All now use STORAGE_BUCKETS instead of hardcoded names      |

---

## References

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/storage/security)
- Configuration: [SUPABASE_BUCKETS_SETUP.md](SUPABASE_BUCKETS_SETUP.md)
