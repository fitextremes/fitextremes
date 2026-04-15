import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatePost } from "@/hooks/usePosts";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();
  const { data: profile } = useProfile();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ content: content.trim(), imageFile: imageFile || undefined });
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      toast.success("Post shared!");
    } catch {
      toast.error("Failed to create post");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-lg overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            "🏋️"
          )}
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            placeholder="Share your fitness update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none min-h-[60px]"
            rows={2}
          />
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button
              variant="hero"
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || createPost.isPending}
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
