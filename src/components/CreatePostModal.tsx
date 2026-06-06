import { useState, useRef } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreatePost } from "@/hooks/usePosts";
import { toast } from "sonner";

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/") && !ACCEPTED_EXTENSIONS.test(selected.name)) {
      toast.error("Please select an image file");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File must be under 5 MB");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));

    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("An image is required");
      return;
    }
    if (!caption.trim()) {
      toast.error("Caption is required");
      return;
    }

    try {
      await createPost.mutateAsync({ content: caption.trim(), imageFile: file });
      toast.success("Post created!");
      setCaption("");
      removeFile();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create post");
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setCaption("");
      removeFile();
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Single image upload */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Image <span className="text-destructive">*</span> (JPG, PNG, WEBP · Max 5 MB)
            </Label>

            {preview ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary max-w-[200px] mx-auto mb-3">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={removeFile}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="w-full border-dashed"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <Label>Caption <span className="text-destructive">*</span></Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            variant="hero"
            className="w-full"
            onClick={handleSubmit}
            disabled={createPost.isPending || !file || !caption.trim()}
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Share Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
