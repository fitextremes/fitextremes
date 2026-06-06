import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreatePost } from "@/hooks/usePosts";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface SubmitOptions {
  requireImage?: boolean;
  onSuccess?: () => void;
  successMessage?: string;
}

export const usePostComposer = () => {
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return null;
    });
  }, []);

  const reset = useCallback(() => {
    setContent("");
    clearImage();
  }, [clearImage]);

  const handleImageSelect = useCallback((file?: File | null) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 5 MB");
      return;
    }

    if (file.type && !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setImageFile(file);
    setImagePreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return URL.createObjectURL(file);
    });
  }, []);

  const submit = useCallback(
    async ({ requireImage = false, onSuccess, successMessage = "Post shared!" }: SubmitOptions = {}) => {
      if (!content.trim()) {
        toast.error("Caption is required");
        return false;
      }

      if (requireImage && !imageFile) {
        toast.error("An image is required");
        return false;
      }

      try {
        await createPost.mutateAsync({
          content: content.trim(),
          imageFile: imageFile || undefined,
        });
        toast.success(successMessage);
        reset();
        onSuccess?.();
        return true;
      } catch (err: any) {
        console.error("[usePostComposer] failed:", err);
        toast.error(err?.message || "Failed to create post");
        return false;
      }
    },
    [content, createPost, imageFile, reset],
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return {
    content,
    setContent,
    imageFile,
    imagePreview,
    isSubmitting: createPost.isPending,
    handleImageSelect,
    clearImage,
    reset,
    submit,
  };
};