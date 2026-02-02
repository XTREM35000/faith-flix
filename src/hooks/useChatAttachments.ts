import { supabase } from '@/integrations/supabase/client';

export async function validateFiles(files: File[]) {
  const errors: string[] = [];
  if (files.length > 3) errors.push('Maximum 3 fichiers par message.');

  for (const f of files) {
    const name = f.name.toLowerCase();
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(name);
    const isPdf = /\.pdf$/i.test(name);
    const isDoc = /\.docx?$/i.test(name);

    if (isImage && f.size > 5 * 1024 * 1024) errors.push(`${f.name}: image trop volumineuse (≤5MB)`);
    if ((isPdf || isDoc) && f.size > 10 * 1024 * 1024) errors.push(`${f.name}: document trop volumineux (≤10MB)`);

    if (!isImage && !isPdf && !isDoc) errors.push(`${f.name}: type de fichier non-supporté`);
  }

  return errors;
}

export async function uploadChatFiles(roomId: string, files: File[]) {
  const bucket = 'paroisse-files';
  const uploaded: Array<{ file_url: string; file_name: string; file_type?: string; file_size?: number }> = [];

  for (const f of files) {
    const timestamp = Date.now();
    const safeName = `${timestamp}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const path = `chat/${roomId}/${safeName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, f, { cacheControl: '3600', upsert: false });
    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    uploaded.push({ file_url: urlData.publicUrl, file_name: f.name, file_type: f.type, file_size: f.size });
  }

  return uploaded;
}
