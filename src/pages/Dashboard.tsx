import { useEffect } from "react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import LoadingScreen from "@/components/LoadingScreen";
import FeedErrorBoundary from "@/components/FeedErrorBoundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { useFeedPosts } from "@/hooks/usePosts";
import { useNavigate } from "react-router-dom";

const FeedContent = () => {
  const { data: feedPosts, isLoading, isError, error, refetch } = useFeedPosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    console.error("[Dashboard] feed error:", error);
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
          Unable to load feed
        </h2>
        <p className="text-sm text-muted-foreground">
          We couldn't load your feed. Please try again.
        </p>
        <Button variant="hero" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const posts = Array.isArray(feedPosts) ? feedPosts : [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Welcome to FitExtremes Feed</p>
        <p className="text-sm mt-1">
          Create a post or follow other users to see their updates!
        </p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
};

const Dashboard = () => {
  const { isTrainer, isBusiness, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleLoading) return;
    if (isTrainer) navigate("/trainer-dashboard", { replace: true });
    else if (isBusiness) navigate("/business-dashboard", { replace: true });
  }, [roleLoading, isTrainer, isBusiness, navigate]);

  if (roleLoading) {
    return <LoadingScreen message="Loading your feed..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Feed" />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <div className="space-y-4">
          <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
            Your <span className="text-gradient-primary">Feed</span>
          </h1>

          <FeedErrorBoundary>
            <CreatePost />
            <FeedContent />
          </FeedErrorBoundary>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
