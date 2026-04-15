import { useState } from "react";
import { Search, UserPlus, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { useExploreUsers, useToggleFollow } from "@/hooks/useSocial";
import { motion } from "framer-motion";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading } = useExploreUsers(searchQuery || undefined);
  const toggleFollow = useToggleFollow();

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-4xl uppercase tracking-wider text-foreground md:text-5xl">
          <span className="text-gradient-primary">Explore</span> Users
        </h1>
        <p className="mt-2 text-muted-foreground">Find and follow fitness enthusiasts</p>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or location..."
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFollow.mutate(u.id)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
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
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Explore;
