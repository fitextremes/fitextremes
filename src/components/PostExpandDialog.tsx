import { Dialog, DialogContent } from "@/components/ui/dialog";
import PostCard from "@/components/PostCard";

interface PostExpandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: any;
}

const PostExpandDialog = ({ open, onOpenChange, post }: PostExpandDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 overflow-hidden">
        <div className="p-4">
          <PostCard post={post} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostExpandDialog;
