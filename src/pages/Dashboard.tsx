import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedPosts } from "@/hooks/usePosts";
import { useExploreUsers, useToggleFollow } from "@/hooks/useSocial";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: feedPosts, isLoading: feedLoading } = useFeedPosts();
  const { data: suggestedUsers } = useExploreUsers();
  const toggleFollow = useToggleFollow();

  if (authLoading) {
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
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Feed (main) */}
          <div className="lg:col-span-2 space-y-4 lg:order-1 order-2">
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
                <p className="text-sm mt-1">
                  Create a post or follow other users to see their updates!
                </p>
              </div>
            )}
          </div>

          {/* Suggested Users sidebar */}
          <div className="space-y-6 lg:order-2 order-1">
            {suggestedUsers && suggestedUsers.length > 0 && (
              <motion.div
                className="rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
