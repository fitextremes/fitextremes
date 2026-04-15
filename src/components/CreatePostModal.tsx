import { useState, useRef } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreatePost } from "@/hooks/usePosts";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    const newPreviews: string[] = [];

    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only JPG, JPEG, PNG, WEBP allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File must be under 5 MB`);
        continue;
      }
      valid.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("At least one image is required");
      return;
    }
    if (!caption.trim()) {
      toast.error("Caption is required");
      return;
    }

    try {
      // Create post with the first image (multi-image can be extended later)
      await createPost.mutateAsync({ content: caption.trim(), imageFile: files[0] });
      toast.success("Post created!");
      setCaption("");
      setFiles([]);
      setPreviews([]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create post");
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setCaption("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
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
          {/* Image upload */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Images <span className="text-destructive">*</span> (JPG, PNG, WEBP · Max 5 MB each)
            </Label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              className="w-full border-dashed"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {files.length === 0 ? "Add Images" : "Add More"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleFilesSelect}
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
            disabled={createPost.isPending || files.length === 0 || !caption.trim()}
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
