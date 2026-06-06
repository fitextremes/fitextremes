import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { usePostComposer } from "@/hooks/usePostComposer";

const CreatePost = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: profile } = useProfile();
  const {
    content,
    setContent,
    imageFile,
    imagePreview,
    isSubmitting,
    handleImageSelect: selectImage,
    clearImage,
    submit,
  } = usePostComposer();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectImage(e.target.files?.[0]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    await submit({ successMessage: "Post shared!" });
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
                onClick={clearImage}
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
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <Button
              variant="hero"
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
