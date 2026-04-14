import { useState } from "react";
import { Heart, MessageCircle, UserPlus, Settings, Camera, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";

const mockUser = {
  name: "Jordan Mitchell",
  username: "@jordanfit",
  location: "Toronto, ON",
  bio: "Fitness enthusiast | Strength training 🏋️ | Plant-based nutrition 🌱 | On a mission to inspire",
  posts: 24,
  followers: 156,
  following: 89,
};

const mockPosts = [
  { id: 1, content: "Hit a new PR on deadlifts today! 315lbs 💪🔥 Consistency pays off.", likes: 42, comments: 8, time: "2h ago" },
  { id: 2, content: "Morning workout done before 6 AM. Best way to start the day ⚡", likes: 28, comments: 3, time: "1d ago" },
  { id: 3, content: "New supplement stack from NutriMax — loving the pre-workout 🥤", likes: 19, comments: 5, time: "3d ago" },
  { id: 4, content: "Just signed up with Alex Carter for personal training. Excited for this journey! 🚀", likes: 55, comments: 12, time: "1w ago" },
];

const mockSuggestions = [
  { name: "Sarah K.", specialty: "Yoga", emoji: "🧘" },
  { name: "Mike R.", specialty: "CrossFit", emoji: "⚡" },
  { name: "Lisa T.", specialty: "Nutrition", emoji: "🥗" },
];

const Dashboard = () => {
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
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
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-4xl ring-4 ring-primary/20">
                  🏋️
                </div>
                <button className="absolute bottom-0 left-1/2 ml-8 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <h2 className="text-center font-display text-2xl uppercase tracking-wider text-foreground">{mockUser.name}</h2>
              <p className="text-center text-sm text-primary">{mockUser.username}</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {mockUser.location}
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">{mockUser.bio}</p>

              <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
                <div className="text-center">
                  <p className="font-display text-lg text-foreground">{mockUser.posts}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-lg text-foreground">{mockUser.followers}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-lg text-foreground">{mockUser.following}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</p>
                </div>
              </div>

              <Button variant="outline" className="mt-4 w-full" size="sm">
                <Edit className="h-3 w-3 mr-2" /> Edit Profile
              </Button>
            </motion.div>

            {/* Suggested */}
            <motion.div
              className="rounded-xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Suggested to Follow</h3>
              <div className="space-y-3">
                {mockSuggestions.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">{s.emoji}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.specialty}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-primary">
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                Your <span className="text-gradient-primary">Feed</span>
              </h1>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* New Post */}
            <motion.div
              className="rounded-xl border border-border bg-card p-4 shadow-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-lg">🏋️</div>
                <input
                  placeholder="Share your fitness update..."
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <Button variant="hero" size="sm">Post</Button>
              </div>
            </motion.div>

            {/* Posts */}
            {mockPosts.map((post, i) => (
              <motion.div
                key={post.id}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">🏋️</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{mockUser.name}</p>
                    <p className="text-xs text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
                <div className="mt-4 flex items-center gap-6 border-t border-border pt-3">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      likedPosts.has(post.id) ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                    {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                    <MessageCircle className="h-4 w-4" /> {post.comments}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
};

export default Dashboard;
