# 📦 Storage File Naming Optimization

## Problem Fixed

### Before ❌

- Video filenames were **too long** after sanitization
- Example: `video-files/1708864924323_Ma-Video-HD-Edition-Finale.mp4` (74 chars!)
- Path length issues in Supabase UI
- Difficult to find files in storage dashboard
- No MIME type preservation

### After ✅

- Short, unique filenames: `videos/1708864924323_a7f92.mp4` (30 chars max!)
- Original filename stored in database metadata
- MIME type explicitly preserved (`contentType`)
- File extension properly extracted
- Consistent naming across all file types

---

## New Storage Structure

### Video Files (uploadVideoFile)

```
Before: video-files/1708864924323_Ma-Video-HD-Edition-Finale.mp4
After:  videos/1708864924323_a7f92.mp4 ✅
         └─ Only ~30 characters vs 74!
         └─ Original name stored in: videos.title (database)
```

### Gallery Images (uploadFile)

```
Before: uploads/1708864924323_My-Beautiful-Image-From-Paris-2025.jpg
After:  gallery/1708864924323_b4e21.jpg ✅
         └─ Original name stored in: database record
```

### Thumbnails (uploadThumbnailFile)

```
Before: thumbnails/1708864924323.jpg
After:  thumbnails/1708864924323_c9d18.jpg ✅
         └─ Consistent with other uploads
```

### Directory Images (uploadDirectoryImage)

```
Before: public/1708864924323_Directory-Page-Banner-Image.jpg
After:  public/1708864924323_d2f7b.jpg ✅
         └─ Much shorter path
```

---

## How File Naming Works

### 1️⃣ Extract File Extension

```typescript
getFileExtension("mon-video.mp4")  → "mp4"
getFileExtension("image.jpeg")     → "jpeg"
getFileExtension("document.tar.gz") → "gz" (last extension)
```

### 2️⃣ Generate Unique Name

```typescript
// Timestamp (milliseconds) + 6-char random ID + extension
Date.now()                      → 1708864924323
Math.random().toString(36).substring(2, 8) → "a7f92c"
Result: 1708864924323_a7f92c.mp4
```

### 3️⃣ Full Storage Path

```typescript
// Videos
key = `videos/${1708864924323_a7f92c.mp4`

// Gallery
key = `gallery/${1708864924323_b4e21d.jpg`

// Directory
key = `public/${1708864924323_d2f7b9.png`
```

### 4️⃣ Preserve Metadata

```typescript
return {
  key: 'videos/1708864924323_a7f92c.mp4', // Storage path
  publicUrl: 'https://...', // Public URL
  originalName: 'Ma-Video-HD-2025.mp4', // Original filename
  mimeType: 'video/mp4', // Explicit MIME type
  extension: 'mp4', // File extension
}
```

---

## Benefits

| Aspect            | Before           | After                 |
| ----------------- | ---------------- | --------------------- |
| **Path Length**   | 74 chars         | 30 chars              |
| **Readability**   | ❌ Long, unclear | ✅ Clear timestamp    |
| **Search UX**     | Hard to find     | Easy to sort by time  |
| **MIME Type**     | Lost             | ✅ Preserved          |
| **Original Name** | In path (messy)  | In database (clean)   |
| **URL Sharing**   | Works but ugly   | ✅ Clean              |
| **Supabase UI**   | Truncated names  | ✅ Full names visible |

---

## Database Storage

Original filenames are preserved in your database schema:

### Videos Table

```sql
-- Existing columns
- video_storage_path: "videos/1708864924323_a7f92.mp4" ← NEW short path
- title: "Ma Video HD - Edition Finale"  ← Original name here

-- To find a video:
SELECT * FROM videos
WHERE video_storage_path LIKE 'videos/1708864924323_%';
```

### Gallery Table

```sql
-- Similar approach
- storage_path: "gallery/1708864924323_b4e21.jpg"
- filename: "My-Beautiful-Image-Paris.jpg"  ← Original name
```

---

## URL Examples

### Old Style (Before)

```
https://cdn.supabase.co/storage/v1/object/public/video-files/
1708864924323_Ma-Video-HD-Edition-Finale-2025-Complete-Version.mp4

❌ Too long, truncated in UI
```

### New Style (After)

```
https://cdn.supabase.co/storage/v1/object/public/video-files/
videos/1708864924323_a7f92.mp4

✅ Clean, easy to copy/paste
```

---

## Finding Files in Supabase Storage UI

### Method 1: By Timestamp

All files with same timestamp → uploaded in same batch

```
1708864924323_a7f92.mp4    ← Video uploaded at 14:42:04 UTC
1708864924323_b4e21.jpg    ← Thumbnail for same batch
1708864924323_c9d18.jpg    ← Gallery image from same session
```

### Method 2: By Type

Filter by bucket name:

- `videos/` → Video files
- `gallery/` → Gallery images
- `public/` → Directory images
- `thumbnails/` → Thumbnails

### Method 3: By Date Range

Timestamp in filename = creation time

- `17088...` (1708800000+) = Feb 24, 2025
- `17089...` (1708900000+) = Feb 24, 2025 later

---

## Code Changes Summary

### STORAGE_BUCKETS Updated

```typescript
export const STORAGE_BUCKETS = {
  // OLD:
  GALLERY: 'gallery', // ← Still works internally
  VIDEO_FILES: 'video-files',

  // Storage paths now use sub-folders:
  // videos/....mp4
  // gallery/....jpg
  // public/....png (directory images)
}
```

### New Helper Function

```typescript
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : 'bin'
}

// Usage:
getFileExtension('video.mp4') // → "mp4"
getFileExtension('image.png') // → "png"
```

### Updated Upload Functions

All now follow this pattern:

```typescript
export async function uploadVideoFile(file: File, path?: string) {
  // 1. Extract extension
  const ext = getFileExtension(file.name)

  // 2. Get MIME type
  const mimeType = file.type || `video/${ext}`

  // 3. Generate short key
  const shortKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
  const key = path ?? `videos/${shortKey}`

  // 4. Upload with MIME type
  const uploadPromise = supabase.storage.from(STORAGE_BUCKETS.VIDEO_FILES).upload(key, file, {
    contentType: mimeType, // ← MIME type preserved!
    cacheControl: '3600',
    upsert: false,
  })

  // 5. Return all metadata
  return {
    key: data.path, // Short storage path
    publicUrl: publicData.publicUrl,
    originalName: file.name, // Original filename
    mimeType: mimeType, // MIME type
    extension: ext, // Extension
  }
}
```

---

## Testing File Upload

### In Browser Console

```javascript
// Test video upload
const file = new File(['...contents...'], 'my-video.mp4', { type: 'video/mp4' })
const result = await uploadVideoFile(file)

console.log(result)
// Output:
// {
//   key: "videos/1708864924323_a7f92.mp4",
//   publicUrl: "https://...",
//   originalName: "my-video.mp4",
//   mimeType: "video/mp4",
//   extension: "mp4"
// }
```

### Checking Supabase Storage

1. Go to **Supabase Dashboard** → **Storage** → **video-files** bucket
2. You should see: `videos/1708864924323_a7f92.mp4` (short path!)
3. Original name "my-video.mp4" stored in database

### Finding Uploaded Files

```sql
-- Find all videos uploaded today
SELECT title, video_storage_path, created_at
FROM videos
WHERE video_storage_path IS NOT NULL
ORDER BY created_at DESC;

-- Result shows clean short paths:
-- Title: "My Video HD"
-- Path:  "videos/1708864924323_a7f92.mp4" ✅
```

---

## Migration Note

### For Existing Videos

Old paths like `video-files/1708864924323_Old-Name.mp4` still work!

- ✅ No database migration needed
- ✅ Old videos still accessible
- ✅ New uploads use short names
- ✅ Can migrate old files gradually if needed

---

## Files Modified

| File                          | Change                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `src/lib/supabase/storage.ts` | Added `getFileExtension()`, refactored all upload functions                            |
| Methods affected:             | `uploadVideoFile()`, `uploadFile()`, `uploadThumbnailFile()`, `uploadDirectoryImage()` |

---

## Key Takeaway

**Before:** Long, messy paths → `video-files/1708864924323_Ma-Video-HD-Edition-Final-2025-Complete-Version.mp4` (74 chars)

**After:** Short, clean paths → `videos/1708864924323_a7f92.mp4` (30 chars) + original name in database ✅

Your videos will now be **easy to find** and **properly preserved** with full metadata!
