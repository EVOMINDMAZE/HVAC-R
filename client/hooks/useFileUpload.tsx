import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from './useToast';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const { user, updateUser } = useSupabaseAuth();
  const { addToast } = useToast();

  const uploadAvatar = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!user) {
      return { url: null, error: 'User not authenticated' };
    }

    if (!file) {
      return { url: null, error: 'No file selected' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Please select an image file' };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: 'File size must be less than 5MB' };
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Enhanced telemetry for storage errors
        console.error('Supabase storage.upload error', { error, fileName, user: user.id });

        // Helpful guidance for common issues
        const msg = (error && (error.message || error.details || error.error)) || String(error);
        if (msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')) {
          const guidance = 'Upload Failed: Storage bucket "avatars" not found. Please create a public "avatars" bucket in your Supabase Storage and ensure your anon key has permission to upload.';
          addToast({ type: 'error', title: 'Upload Failed', description: guidance });
          return { url: null, error: guidance };
        }

        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update user profile with new avatar URL
      const { error: updateError } = await updateUser({
        data: {
          avatar_url: publicUrl
        }
      });

      if (updateError) {
        console.error('Failed to update user profile after avatar upload', { updateError, user: user.id });
        throw updateError;
      }

      addToast({
        type: 'success',
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully'
      });

      return { url: publicUrl, error: null };
    } catch (error: any) {
      const errorMessage = error?.message || error?.details || 'Failed to upload image';

      // Log detailed telemetry to console
      console.error('uploadAvatar error', { error });

      // If it's a bucket not found error provide actionable steps
      if (String(errorMessage).toLowerCase().includes('bucket') || String(errorMessage).toLowerCase().includes('not found')) {
        const guidance = 'Upload Failed: Storage bucket "avatars" not found. To fix this: 1) Open your Supabase dashboard -> Storage -> Create a bucket named "avatars"; 2) Set the bucket to public or configure RLS/policies to allow uploads; 3) Retry the upload.';
        addToast({ type: 'error', title: 'Upload Failed', description: guidance });
        return { url: null, error: guidance };
      }

      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: errorMessage
      });
      return { url: null, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (): Promise<{ success: boolean; error: string | null }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setUploading(true);

      // Update user profile to remove avatar URL
      const { error: updateError } = await updateUser({
        data: {
          avatar_url: null
        }
      });

      if (updateError) {
        throw updateError;
      }

      addToast({
        type: 'success',
        title: 'Avatar Removed',
        description: 'Your profile picture has been removed'
      });

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove avatar';
      addToast({
        type: 'error',
        title: 'Remove Failed',
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    uploading
  };
}
