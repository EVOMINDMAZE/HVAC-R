import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useToast } from "./useToast";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const { user, updateUser } = useSupabaseAuth();
  const { addToast } = useToast();

  const uploadAvatar = async (
    file: File,
  ): Promise<{ url: string | null; error: string | null }> => {
    if (!user) {
      return { url: null, error: "User not authenticated" };
    }

    if (!file) {
      return { url: null, error: "No file selected" };
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { url: null, error: "Please select an image file" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: "File size must be less than 5MB" };
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // Determine bucket name (env override allowed)
      const AVATAR_BUCKET = (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) || 'avatars';
      const fallbackBucket = 'public-avatars';

      // Helper to attempt list on a bucket and return result
      const checkBucket = async (bucketName: string) => {
        try {
          const res = await supabase.storage.from(bucketName).list('', { limit: 1 });
          return res;
        } catch (e) {
          return { data: null, error: e };
        }
      };

      // Preflight: check configured bucket, then fallback bucket
      let bucketToUse = AVATAR_BUCKET;
      let listResult = await checkBucket(bucketToUse);
      if (listResult && (listResult as any).error) {
        console.warn('Bucket preflight check failed for', bucketToUse, listResult);
        // Try fallback
        bucketToUse = fallbackBucket;
        listResult = await checkBucket(bucketToUse);
      }

      if (listResult && (listResult as any).error) {
        // Bucket likely missing or access denied
        console.error('Supabase storage.list error', { listError: listResult.error, triedBucket: bucketToUse });
        const msg = (listResult.error && (listResult.error.message || String(listResult.error))) || String(listResult.error);
        if (String(msg).toLowerCase().includes('bucket') || String(msg).toLowerCase().includes('not found') || String(msg).toLowerCase().includes('404')) {
          const guidance = `Upload Failed: Storage bucket "${AVATAR_BUCKET}" (or fallback "${fallbackBucket}") not found or inaccessible. Please create a public bucket and ensure your anon key has permission to upload.`;
          addToast({ type: 'error', title: 'Upload Failed', description: guidance });
          // Emit telemetry event
          try { window.dispatchEvent(new CustomEvent('storage:upload_failed', { detail: { reason: 'bucket_not_found', user: user.id, attemptedBucket: bucketToUse } })); } catch(e){}
          return { url: null, error: guidance };
        }
      }

      // Upload to Supabase Storage (using resolved bucketToUse)
      const { data, error } = await supabase.storage
        .from(bucketToUse)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        // Enhanced telemetry for storage errors - stringify to avoid [object Object]
        let errStr = '';
        try {
          errStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch (e) {
          errStr = String(error);
        }

        console.error(`Supabase storage.upload error: ${errStr}`, { fileName, user: user?.id, bucket: bucketToUse });

        // Emit telemetry event for monitoring
        try {
          window.dispatchEvent(
            new CustomEvent('storage:upload_failed', {
              detail: {
                reason: 'upload_error',
                message: error?.message || errStr,
                user: user?.id,
                bucket: bucketToUse,
              },
            }),
          );
        } catch (e) {}

        // Helpful guidance for common issues
        const msg = (error && (error.message || errStr)) || String(error);
        if (String(msg).toLowerCase().includes('bucket') || String(msg).toLowerCase().includes('not found')) {
          const guidance = `Upload Failed: Storage bucket "${(import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) || 'avatars'}" not found or inaccessible. Please create a public bucket (e.g. "${fallbackBucket}") and ensure your anon key has permission to upload.`;
          addToast({ type: 'error', title: 'Upload Failed', description: guidance });
          return { url: null, error: guidance };
        }

        const guidance = `Upload Failed: ${msg}`;
        addToast({ type: 'error', title: 'Upload Failed', description: guidance });
        return { url: null, error: guidance };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketToUse).getPublicUrl(data.path);

      // Update user profile with new avatar URL
      const { error: updateError } = await updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        console.error("Failed to update user profile after avatar upload", {
          updateError,
          user: user.id,
        });
        throw updateError;
      }

      addToast({
        type: "success",
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully",
      });

      return { url: publicUrl, error: null };
    } catch (error: any) {
      const errorMessage =
        error?.message || String(error) || "Failed to upload image";

      // Log detailed telemetry to console
      console.error("uploadAvatar error", { error });

      // If it's a bucket not found error provide actionable steps
      if (
        String(errorMessage).toLowerCase().includes('bucket') ||
        String(errorMessage).toLowerCase().includes('not found')
      ) {
        const guidance = `Upload Failed: Storage bucket "${(import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string) || 'avatars'}" not found. To fix this: 1) Open your Supabase dashboard -> Storage -> Create a bucket with that name (or create 'public-avatars'); 2) Set the bucket to public or configure RLS/policies to allow uploads; 3) Retry the upload.`;
        addToast({
          type: 'error',
          title: 'Upload Failed',
          description: guidance,
        });
        return { url: null, error: guidance };
      }

      addToast({
        type: "error",
        title: "Upload Failed",
        description: errorMessage,
      });
      return { url: null, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (): Promise<{
    success: boolean;
    error: string | null;
  }> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      setUploading(true);

      // Update user profile to remove avatar URL
      const { error: updateError } = await updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (updateError) {
        throw updateError;
      }

      addToast({
        type: "success",
        title: "Avatar Removed",
        description: "Your profile picture has been removed",
      });

      return { success: true, error: null };
    } catch (error: any) {
      const errorMessage = error.message || "Failed to remove avatar";
      addToast({
        type: "error",
        title: "Remove Failed",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    uploading,
  };
}
