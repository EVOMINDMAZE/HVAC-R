import { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';

// POST /api/storage/upload
// Body: { filename, contentBase64, bucket }
export const uploadAvatar: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    // Expect JSON body with filename and base64 content
    const { filename, contentBase64, bucket } = req.body as { filename?: string; contentBase64?: string; bucket?: string };

    if (!filename || !contentBase64) {
      console.error('Invalid upload request - missing fields', { filename, hasContent: !!contentBase64 });
      return res.status(400).json({ error: 'Missing filename or content' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Server not configured for storage uploads - missing env vars');
      return res.status(500).json({ error: 'Server not configured for storage uploads' });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    let buf: Buffer;
    try {
      buf = Buffer.from(contentBase64, 'base64');
    } catch (e) {
      console.error('Failed to decode base64 content', e);
      return res.status(400).json({ error: 'Invalid file content' });
    }

    const bucketName = bucket || (process.env.VITE_SUPABASE_AVATAR_BUCKET as string) || 'public-avatars';

    // Upload using the admin client
    const { data, error } = await admin.storage.from(bucketName).upload(filename, buf, { upsert: false });
    if (error) {
      console.error('Server upload error', error);
      return res.status(500).json({ error: 'Upload failed', details: error });
    }

    const publicRes = admin.storage.from(bucketName).getPublicUrl((data as any).path);
    const publicUrl = (publicRes as any).data?.publicUrl;

    return res.status(200).json({ success: true, publicUrl });
  } catch (err) {
    console.error('uploadAvatar handler error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
