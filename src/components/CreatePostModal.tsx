import { useRef } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePostComposer } from "@/hooks/usePostComposer";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostModal = ({ open, onOpenChange }: CreatePostModalProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    content,
    setContent,
    imageFile,
    imagePreview,
    isSubmitting,
    handleImageSelect,
    clearImage,
    reset,
    submit,
  } = usePostComposer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files?.[0]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    await submit({
      requireImage: true,
      successMessage: "Post created!",
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      reset();
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

            {imagePreview ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary max-w-[200px] mx-auto mb-3">
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={clearImage}
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
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <Label>Caption <span className="text-destructive">*</span></Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            variant="hero"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !imageFile || !content.trim()}
          >
            {isSubmitting ? (
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
