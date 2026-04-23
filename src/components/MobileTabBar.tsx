import { Link, useLocation } from "react-router-dom";
import { Home, Users, User, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const tabs = [
  { to: "/dashboard", icon: Home, label: "Feed" },
  { to: "/explore", icon: Users, label: "Explore" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/profile", icon: User, label: "Profile" },
];

const MobileTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isSocial, loading } = useUserRole();

  // Social-only bottom navigation; hidden for logged-out, trainers, and businesses
  if (loading || !user || !isSocial) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider font-display">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
