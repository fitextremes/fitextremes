import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import FollowButton from "@/components/FollowButton";
import { useExploreUsers } from "@/hooks/useSocial";
import { motion } from "framer-motion";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading } = useExploreUsers(searchQuery || undefined);

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Explore" />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <p className="text-muted-foreground">Find and follow fitness enthusiasts</p>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or location"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="col-span-full text-center text-muted-foreground py-8">Loading...</p>
          ) : users && users.length > 0 ? (
            users.map((u, i) => (
              <motion.div
                key={u.id}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg uppercase tracking-wider text-foreground truncate">
                      {u.full_name}
                    </h3>
                    {u.username && (
                      <p className="text-sm text-primary truncate">@{u.username}</p>
                    )}
                    {u.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" /> {u.location}
                      </div>
                    )}
                  </div>
                </div>
                {u.bio && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{u.bio}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="hero" size="sm" className="flex-1" asChild>
                    <Link to={`/user/${u.username || u.id}`}>View Profile</Link>
                  </Button>
                  <FollowButton
                    targetUserId={u.id}
                    isPrivate={u.profile_visibility === "private"}
                    iconOnly
                    variant="outline"
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-lg">No users found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
};

export default Explore;
