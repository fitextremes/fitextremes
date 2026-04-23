import { useState } from "react";
import { Camera, MapPin, Edit, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import EditProfileDialog from "@/components/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useFeedPosts, useUserPosts } from "@/hooks/usePosts";
import { useFollowerCount, useFollowingCount, useExploreUsers, useToggleFollow } from "@/hooks/useSocial";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, UserMinus } from "lucide-react";

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: feedPosts, isLoading: feedLoading } = useFeedPosts();
  const { data: userPosts } = useUserPosts(user?.id);
  const { data: followerCount } = useFollowerCount(user?.id);
  const { data: followingCount } = useFollowingCount(user?.id);
  const { data: suggestedUsers } = useExploreUsers();
  const toggleFollow = useToggleFollow();
  const [editOpen, setEditOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Feed" />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="space-y-6">
            <motion.div
              className="rounded-xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative mb-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-4xl ring-4 ring-primary/20 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🏋️"
                  )}
                </div>
              </div>
              <h2 className="text-center font-display text-2xl uppercase tracking-wider text-foreground">
                {profile?.full_name}
              </h2>
              <p className="text-center text-sm text-primary">
                {profile?.username ? `@${profile.username}` : ""}
              </p>
              {profile?.location && (
                <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </div>
              )}
              {profile?.bio && (
                <p className="mt-3 text-center text-sm text-muted-foreground">{profile.bio}</p>
              )}

              <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
                <div className="text-center">
                  <p className="font-display text-lg text-foreground">{userPosts?.length || 0}</p>
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

              <Button variant="outline" className="mt-4 w-full" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-3 w-3 mr-2" /> Edit Profile
              </Button>
            </motion.div>

            {/* Suggested Users */}
            {suggestedUsers && suggestedUsers.length > 0 && (
              <motion.div
                className="rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">
                  Suggested to Follow
                </h3>
                <div className="space-y-3">
                  {suggestedUsers.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between">
                      <Link to={`/user/${u.username || u.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg overflow-hidden">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.username ? `@${u.username}` : u.location || ""}
                          </p>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-primary"
                        onClick={() => toggleFollow.mutate(u.id)}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link to="/explore">Explore All Users</Link>
                </Button>
              </motion.div>
            )}
          </div>

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                Your <span className="text-gradient-primary">Feed</span>
              </h1>
            </div>

            <CreatePost />

            {feedLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading feed...</p>
            ) : feedPosts && feedPosts.length > 0 ? (
              feedPosts.map((post: any) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Your feed is empty</p>
                <p className="text-sm mt-1">Create a post or follow other users to see their updates!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            full_name: profile.full_name,
            bio: profile.bio,
            location: profile.location,
            avatar_url: profile.avatar_url,
            profile_visibility: profile.profile_visibility,
          }}
        />
      )}

      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
