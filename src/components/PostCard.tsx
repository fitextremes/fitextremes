import { useState } from "react";
import { Heart, MessageCircle, Trash2, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToggleReaction, useAddComment, usePostComments } from "@/hooks/useSocial";
import { useDeletePost } from "@/hooks/usePosts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import ImageLightbox from "@/components/ImageLightbox";

const REACTION_EMOJIS = ["💪", "✊", "🔥", "🔩"];

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: { id: string; username: string | null; full_name: string; avatar_url: string | null };
    reactions: { id: string; emoji: string; user_id: string }[];
    comments: { id: string }[];
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const toggleReaction = useToggleReaction();
  const addComment = useAddComment();
  const deletePost = useDeletePost();
  const { data: comments } = usePostComments(showComments ? post?.id : undefined);

  if (!post) return null;

  const profile = post.profiles ?? { id: post.user_id, username: null, full_name: "FitExtremes User", avatar_url: null };
  const reactions = Array.isArray(post.reactions) ? post.reactions : [];
  const postComments = Array.isArray(post.comments) ? post.comments : [];

  const isOwn = user?.id === post.user_id;
  let timeAgo = "";
  try {
    timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "";
  } catch {
    timeAgo = "";
  }

  const userReactions = reactions.filter((r) => r.user_id === user?.id).map((r) => r.emoji);

  const reactionCounts = reactions.reduce((acc, r) => {
    if (!r?.emoji) return acc;
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-6 shadow-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link to={`/user/${profile.username || profile.id}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              "🏋️"
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{profile.full_name || "FitExtremes User"}</p>
            <p className="text-xs text-muted-foreground">
              {profile.username ? `@${profile.username}` : ""} · {timeAgo}
            </p>
          </div>
        </Link>
        {isOwn && (
          <button
            onClick={() => {
              deletePost.mutate(post.id);
              toast.success("Post deleted");
            }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      {post.image_url && (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="mt-3 block w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Expand image"
          >
            <img
              src={post.image_url}
              alt="Post image"
              loading="lazy"
              className="max-h-96 w-full object-cover transition-transform hover:scale-[1.02] cursor-zoom-in"
            />
          </button>
          <ImageLightbox
            open={lightboxOpen}
            src={post.image_url}
            alt="Post image"
            onClose={() => setLightboxOpen(false)}
          />
        </>
      )}

      {/* Reaction counts */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => toggleReaction.mutate({ postId: post.id, emoji })}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                userReactions.includes(emoji)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
              }`}
            >
              {emoji} {count}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <SmilePlus className="h-4 w-4" />
            React
          </button>
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-lg border border-border bg-card p-2 shadow-card"
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      toggleReaction.mutate({ postId: post.id, emoji });
                      setShowReactions(false);
                    }}
                    className="hover:scale-125 transition-transform text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> {postComments.length}
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {comments?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs overflow-hidden">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs">
                      <span className="font-medium text-foreground">{c.profiles?.full_name}</span>{" "}
                      <span className="text-muted-foreground">{c.content}</span>
                    </p>
                  </div>
                </div>
              ))}
              {user && (
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    className="h-8 text-xs"
                  />
                  <Button
                    variant="hero"
                    size="sm"
                    className="h-8"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                  >
                    Send
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
