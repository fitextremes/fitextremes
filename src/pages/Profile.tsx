import { useState } from "react";
import { Plus, Grid3X3, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import MobileTabBar from "@/components/MobileTabBar";
import SocialTopBar from "@/components/SocialTopBar";
import CreatePostModal from "@/components/CreatePostModal";
import FollowListModal from "@/components/FollowListModal";
import PostExpandDialog from "@/components/PostExpandDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserPosts } from "@/hooks/usePosts";
import { useFollowerCount, useFollowingCount } from "@/hooks/useSocial";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userPosts } = useUserPosts(user?.id);
  const { data: followerCount } = useFollowerCount(user?.id);
  const { data: followingCount } = useFollowingCount(user?.id);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);
  const [expandedPost, setExpandedPost] = useState<any>(null);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Profile" />

      {/* Floating Create Post button */}
      <button
        onClick={() => setCreatePostOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all"
        title="Create new post"
        aria-label="Create new post"
      >
        <Plus className="h-6 w-6" />
      </button>

      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <motion.div
          className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-card text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar */}
          <div className="mx-auto flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-secondary text-4xl ring-4 ring-primary/20 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-muted-foreground">
                {getInitials(profile?.full_name || "U")}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mt-4 font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">
            {profile?.full_name}
          </h1>
          {profile?.username && (
            <p className="text-sm text-primary">@{profile.username}</p>
          )}

          {/* Location */}
          {profile?.location ? (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {profile.location}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/50 italic">Add location</p>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
            <button
              className="text-center hover:opacity-80 transition-opacity"
              onClick={() => {
                const el = document.getElementById("posts-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <p className="font-display text-lg text-foreground">{userPosts?.length || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Posts</p>
            </button>
            <button
              className="text-center hover:opacity-80 transition-opacity"
              onClick={() => setFollowListType("followers")}
            >
              <p className="font-display text-lg text-foreground">{followerCount || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
            </button>
            <button
              className="text-center hover:opacity-80 transition-opacity"
              onClick={() => setFollowListType("following")}
            >
              <p className="font-display text-lg text-foreground">{followingCount || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</p>
            </button>
          </div>

          {/* Edit Profile */}
          <Button variant="outline" className="mt-4 w-full" size="sm" asChild>
            <Link to="/edit-profile">
              <Edit className="h-3 w-3 mr-2" /> Edit Profile
            </Link>
          </Button>
        </motion.div>

        {/* Posts Grid */}
        <div id="posts-section" className="mt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Posts</h2>
          </div>

          {userPosts && userPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {userPosts.map((post: any) => (
                <button
                  key={post.id}
                  onClick={() => setExpandedPost(post)}
                  className="relative aspect-square overflow-hidden rounded-md bg-secondary group"
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-2">
                      <p className="text-xs text-muted-foreground line-clamp-4 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}
                  {/* Hover overlay with counts */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="text-xs text-foreground font-medium">❤️ {post.reactions?.length || 0}</span>
                    <span className="text-xs text-foreground font-medium">💬 {post.comments?.length || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No posts yet</p>
              <p className="text-sm mt-1">Tap the + button to share your first post!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal open={createPostOpen} onOpenChange={setCreatePostOpen} />
      {followListType && user && (
        <FollowListModal
          open={!!followListType}
          onOpenChange={() => setFollowListType(null)}
          userId={user.id}
          type={followListType}
        />
      )}
      {expandedPost && (
        <PostExpandDialog
          open={!!expandedPost}
          onOpenChange={() => setExpandedPost(null)}
          post={expandedPost}
        />
      )}

      <MobileTabBar />
    </div>
  );
};

export default Profile;
