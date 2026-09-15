import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import PostCard from "@/components/PostCard";
import { usePost } from "@/hooks/usePosts";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = usePost(id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Post" />
      <div className="container mx-auto px-4 pt-20 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : post ? (
          <PostCard post={post as any} />
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-foreground">This post is no longer available.</p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link to="/dashboard">Back to Feed</Link>
            </Button>
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
};

export default PostDetail;
