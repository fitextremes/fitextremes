import { useEffect } from "react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useFeedPosts } from "@/hooks/usePosts";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { data: feedPosts, isLoading: feedLoading } = useFeedPosts();

  useEffect(() => {
    if (!roleLoading && isTrainer) navigate("/trainer-dashboard", { replace: true });
  }, [roleLoading, isTrainer, navigate]);

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
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <div className="space-y-4">
          <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
            Your <span className="text-gradient-primary">Feed</span>
          </h1>

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
      </div>

      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
