import { supabase } from "@/integrations/supabase/client";

// Centralized bucket configuration from environment variables
export const STORAGE_BUCKETS = {
  GALLERY: (import.meta.env.VITE_BUCKET_GALLERY as string) || 'gallery',
  VIDEO_FILES: (import.meta.env.VITE_BUCKET_VIDEO_FILES as string) || 'video-files',
  VIDEOS: (import.meta.env.VITE_BUCKET_PUBLIC as string) || 'videos',
  DIRECTORY_IMAGES: (import.meta.env.VITE_BUCKET_DIRECTORY_IMAGES as string) || 'directory-images',
  PAROISSE_FILES: (import.meta.env.VITE_BUCKET_PAROISSE_FILES as string) || 'paroisse-files',
  AVATARS: (import.meta.env.VITE_BUCKET_AVATAR as string) || 'avatars',
};

console.log('[storage.ts] Initialized STORAGE_BUCKETS:', STORAGE_BUCKETS);

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9.\-_]/g, '-') // keep safe chars only
    .replace(/-+/g, '-') // avoid multiple dashes
    .substring(0, 100); // limit to 100 chars max
}

/**
 * Extract file extension safely
 * e.g., "video.mp4" -> "mp4", "document.tar.gz" -> "gz"
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'bin';
}

export async function uploadVideoFile(file: File, path?: string) {
  const ext = getFileExtension(file.name);
  const mimeType = file.type || `video/${ext}`;
  
  // Use timestamp + short hash instead of full filename to keep paths short
  // Original filename stored in DB, not in storage path
  const shortKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const key = path ?? `${shortKey}`; // Direct path in bucket root for Supabase UI visibility

  console.log(`[uploadVideoFile] uploading ${file.name} (${ext}, ${mimeType}) -> ${key} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  try {
    // Try upload with timeout and retry logic for large files
    type SupabaseUploadResponse = { data: { path: string } | null; error: Error | null };
    const attemptUpload = async (attempt = 1): Promise<SupabaseUploadResponse> => {
      console.log(`[uploadVideoFile] attempt ${attempt} starting for key=${key}`);
      const uploadPromise = supabase.storage
        .from(STORAGE_BUCKETS.VIDEO_FILES)
        .upload(key, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: mimeType, // Preserve MIME type
        });
      
      // Longer timeout for large video files (5 minutes)
      const timeoutMs = 300000;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`upload timeout after ${timeoutMs / 1000}s`)), timeoutMs)
      );
      
      return (await Promise.race([uploadPromise, timeout])) as SupabaseUploadResponse;
    };

    let data: { path: string } | null = null;
    try {
      const first = await attemptUpload(1);
      if (first.error) throw first.error;
      data = first.data;
      console.log(`[uploadVideoFile] attempt 1 succeeded, path=${data?.path}`);
    } catch (e) {
      console.warn(`[uploadVideoFile] attempt 1 failed, retrying...`, e);
      try {
        const second = await attemptUpload(2);
        if (second.error) throw second.error;
        data = second.data;
        console.log(`[uploadVideoFile] attempt 2 succeeded, path=${data?.path}`);
      } catch (err) {
        console.error('[uploadVideoFile] both attempts failed', err);
        throw err;
      }
    }

    if (!data?.path) {
      throw new Error('No path returned from upload');
    }

    console.log(`[uploadVideoFile] retrieving public URL for path=${data.path}`);
    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKETS.VIDEO_FILES)
      .getPublicUrl(data.path);

    if (!publicData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log(`[uploadVideoFile] upload complete - publicUrl=${publicData.publicUrl}`);
    
    // Return both the storage path and original filename for record keeping
    return { 
      key: data.path,
      publicUrl: publicData.publicUrl,
      originalName: file.name,
      mimeType: mimeType,
      extension: ext
    };
  } catch (e) {
    console.error('[uploadVideoFile] unexpected error', e);
    throw e;
  }
}

// Deprecated: Use STORAGE_BUCKETS.GALLERY instead
export const GALLERY_BUCKET = STORAGE_BUCKETS.GALLERY;

export async function uploadFile(file: File, path?: string) {
  const ext = getFileExtension(file.name);
  const mimeType = file.type || `image/${ext}`;
  
  // Use timestamp + short hash for consistency with video uploads
  const shortKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const key = path ?? `${shortKey}`; // Direct path in bucket root for Supabase UI visibility
  
  console.log('[uploadFile] uploading', { fileName: file.name, ext, key, bucket: GALLERY_BUCKET });
  try {
    // Try upload with a timeout and one retry to handle flaky network
    type SupabaseUploadResponse = { data: { path: string } | null; error: Error | null };
    const attemptUpload = async (attempt = 1): Promise<SupabaseUploadResponse> => {
      console.log(`[uploadFile] attempt ${attempt} starting for key=${key}`);
      const uploadPromise = supabase.storage.from(GALLERY_BUCKET).upload(key, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType, // Preserve MIME type
      });
      const timeoutMs = 60000;
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('upload timeout')), timeoutMs));
      return (await Promise.race([uploadPromise, timeout])) as SupabaseUploadResponse;
    };

    let data: { path: string } | null = null;
    try {
      const first = await attemptUpload(1);
      if (first.error) throw first.error;
      data = first.data;
    } catch (e) {
      console.warn('uploadFile first attempt failed, retrying...', e);
      try {
        const second = await attemptUpload(2);
        if (second.error) throw second.error;
        data = second.data;
      } catch (err) {
        console.error('[uploadFile] both attempts failed', err);
        return null;
      }
    }

    console.log('[uploadFile] upload succeeded, path=', data.path);
    const { data: publicData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path);
    console.log('[uploadFile] publicUrl=', publicData?.publicUrl);
    return { 
      key: data.path, 
      publicUrl: publicData.publicUrl,
      originalName: file.name,
      extension: ext,
      mimeType: mimeType
    };
  } catch (e) {
    console.error('[uploadFile] unexpected error', e);
    return null;
  }
}

export function getPublicUrl(path: string) {
  try {
    const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('getPublicUrl error', e);
    return null;
  }
}

export async function createVideoRecord(record: {
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  category?: string;
  user_id: string;
  views?: number;
  likes?: number;
  created_at?: string;
  updated_at?: string;
}) {
  const { data, error } = await supabase.from("videos").insert([record]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadThumbnailFile(blob: Blob, filename?: string) {
  // Generate short, unique name for thumbnail
  const shortKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  const name = filename ?? `${shortKey}`; // Direct path in bucket root for Supabase UI visibility
  const file = new File([blob], name.split('/').pop() ?? name, { type: 'image/jpeg' });
  
  const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.VIDEOS).upload(name, file, { 
    upsert: true,
    contentType: 'image/jpeg'
  });
  if (error) throw error;
  const { data: publicData } = supabase.storage.from(STORAGE_BUCKETS.VIDEOS).getPublicUrl(data.path);
  return { key: data.path, publicUrl: publicData.publicUrl };
}

export async function generateThumbnailFromFile(file: File, seekTo = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.muted = true;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      video.addEventListener('loadeddata', () => {
        const duration = video.duration || 0;
        const time = Math.min(Math.max(0, seekTo), 0.99) * duration;
        const seekHandler = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Impossible de générer la miniature'));
                cleanup();
                return;
              }
              resolve(blob);
              cleanup();
            }, 'image/jpeg', 0.85);
          } catch (e) {
            reject(e);
            cleanup();
          }
        };

        if (video.readyState >= 2) {
          video.currentTime = time;
        }
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          seekHandler();
        };
        video.addEventListener('seeked', onSeeked);
      });

      video.addEventListener('error', () => {
        reject(new Error('Erreur lors du chargement de la vidéo pour la miniature'));
        cleanup();
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function testStorageConnection() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: 'Not authenticated' };
    
    console.log('testStorageConnection: user id =', user.id);
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('testStorageConnection: buckets', buckets?.map(b => b.name), bucketsError);
    
    if (!buckets) return { ok: false, message: 'Failed to list buckets' };
    
    const bucketNames = buckets.map(b => b.name);
    const galleryExists = bucketNames.includes(STORAGE_BUCKETS.GALLERY);
    const videoFilesExists = bucketNames.includes(STORAGE_BUCKETS.VIDEO_FILES);
    
    console.log(`testStorageConnection: gallery=${galleryExists}, video-files=${videoFilesExists}`);
    
    if (!galleryExists) {
      return { ok: false, message: `❌ Bucket "${STORAGE_BUCKETS.GALLERY}" not found. Available: ` + bucketNames.join(', ') };
    }
    
    if (!videoFilesExists) {
      return { ok: false, message: `❌ Bucket "${STORAGE_BUCKETS.VIDEO_FILES}" not found. Available: ` + bucketNames.join(', ') };
    }
    
    // Test gallery bucket
    const galleryBlob = new Blob(['test'], { type: 'text/plain' });
    const galleryFile = new File([galleryBlob], '_test_connection.txt');
    const { error: galleryError } = await supabase.storage.from(STORAGE_BUCKETS.GALLERY).upload('_test/connection.txt', galleryFile, { upsert: true });
    if (galleryError) {
      return { ok: false, message: `❌ ${STORAGE_BUCKETS.GALLERY} bucket test failed: ` + galleryError.message };
    }
    
    // Test video-files bucket
    const videoBlob = new Blob(['test'], { type: 'text/plain' });
    const videoFile = new File([videoBlob], '_test_connection.txt');
    const { error: videoError } = await supabase.storage.from(STORAGE_BUCKETS.VIDEO_FILES).upload('_test/connection.txt', videoFile, { upsert: true });
    if (videoError) {
      return { ok: false, message: `❌ ${STORAGE_BUCKETS.VIDEO_FILES} bucket test failed: ` + videoError.message };
    }
    
    return { ok: true, message: '✅ All storage tests passed (gallery + video-files)' };
  } catch (e) {
    console.error('testStorageConnection error', e);
    return { ok: false, message: '❌ Storage connection error: ' + String(e) };
  }
}
// Directory & About storage helpers
export async function uploadDirectoryImage(file: File, bucketName: string = STORAGE_BUCKETS.DIRECTORY_IMAGES) {
  const ext = getFileExtension(file.name);
  const mimeType = file.type || `image/${ext}`;
  
  // Use timestamp + short hash for consistency
  const shortKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const key = `${shortKey}`; // Direct path in bucket root for Supabase UI visibility
  
  try {
    // same retry/timeout logic as uploadFile
    type SupabaseUploadResponse = { data: { path: string } | null; error: Error | null };
    const attemptUpload = async (attempt = 1): Promise<SupabaseUploadResponse> => {
      const uploadPromise = supabase.storage.from(bucketName).upload(key, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType, // Preserve MIME type
      });
      const timeoutMs = 60000;
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('upload timeout')), timeoutMs));
      return (await Promise.race([uploadPromise, timeout])) as SupabaseUploadResponse;
    };

    let data: { path: string } | null = null;
    try {
      const first = await attemptUpload(1);
      if (first.error) throw first.error;
      data = first.data;
    } catch (e) {
      console.warn('uploadDirectoryImage first attempt failed, retrying...', e);
      try {
        const second = await attemptUpload(2);
        if (second.error) throw second.error;
        data = second.data;
      } catch (err) {
        console.error('uploadDirectoryImage error', err);
        return null;
      }
    }

    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return { 
      key: data.path, 
      publicUrl: publicData.publicUrl,
      originalName: file.name,
      extension: ext,
      mimeType: mimeType
    };
  } catch (e) {
    console.error('uploadDirectoryImage unexpected error', e);
    return null;
  }
}