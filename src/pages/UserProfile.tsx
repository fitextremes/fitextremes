import { useParams } from "react-router-dom";
import { MapPin, UserPlus, UserMinus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import { useProfile, useProfileByUsername } from "@/hooks/useProfile";
import { useUserPosts } from "@/hooks/usePosts";
import { useFollowStatus, useToggleFollow, useFollowerCount, useFollowingCount } from "@/hooks/useSocial";
import { useAuth } from "@/contexts/AuthContext";

const UserProfile = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const { user } = useAuth();

  const isUUID = identifier && /^[0-9a-f-]{36}$/i.test(identifier);
  const { data: profileByUsername } = useProfileByUsername(!isUUID ? identifier || "" : "");
  const { data: profileById } = useProfile(isUUID ? identifier : undefined);

  const profile = profileByUsername || profileById;
  const profileId = profile?.id;

  const isOwnProfile = user?.id === profileId;
  const isPrivate = profile?.profile_visibility === "private";
  const { data: isFollowing } = useFollowStatus(profileId);
  const canViewContent = isOwnProfile || !isPrivate || isFollowing;

  const { data: posts, isLoading: postsLoading } = useUserPosts(canViewContent ? profileId : undefined);
  const toggleFollow = useToggleFollow();
  const { data: followerCount } = useFollowerCount(profileId);
  const { data: followingCount } = useFollowingCount(profileId);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <motion.div
          className="rounded-xl border border-border bg-card p-8 shadow-card text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-4xl ring-4 ring-primary/20 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              "🏋️"
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl uppercase tracking-wider text-foreground">
            {profile.full_name}
          </h1>
          {profile.username && (
            <p className="text-sm text-primary">@{profile.username}</p>
          )}
          {isPrivate && !isOwnProfile && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Private Profile
            </div>
          )}
          {profile.location && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {profile.location}
            </div>
          )}
          {canViewContent && profile.bio && (
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">{profile.bio}</p>
          )}

          <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
            <div className="text-center">
              <p className="font-display text-lg text-foreground">{canViewContent ? (posts?.length || 0) : "—"}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-foreground">{followerCount || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-foreground">{followingCount || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</p>
            </div>
          </div>

          {!isOwnProfile && user && (
            <Button
              variant={isFollowing ? "outline" : "hero"}
              className="mt-4"
              onClick={() => profileId && toggleFollow.mutate(profileId)}
            >
              {isFollowing ? (
                <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Follow</>
              )}
            </Button>
          )}
        </motion.div>

        {/* User's posts */}
        <div className="mt-8 space-y-4">
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Posts</h2>
          {!canViewContent ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-lg">This account is private</p>
              <p className="text-sm mt-1">Follow this user to see their posts</p>
            </div>
          ) : postsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : posts && posts.length > 0 ? (
            posts.map((post: any) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-muted-foreground py-8">No posts yet</p>
          )}
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
};

export default UserProfile;
