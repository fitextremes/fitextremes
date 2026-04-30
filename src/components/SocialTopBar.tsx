import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { useUserRole } from "@/hooks/useUserRole";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.png";

interface SocialTopBarProps {
  title: "Feed" | "Explore" | "Discover" | "Profile" | "Business";
}

const SocialTopBar = ({ title }: SocialTopBarProps) => {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { isSocial } = useUserRole();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FitExtremes" className="h-8 w-8 object-contain" />
            <span className="hidden sm:inline font-display text-lg uppercase tracking-wider text-foreground">
              Fit<span className="text-primary">Extremes</span>
            </span>
          </Link>

          <h1 className="font-display text-base sm:text-lg uppercase tracking-wider text-foreground">
            {title}
          </h1>

          <div className="flex items-center gap-3">
            {isSocial && <NotificationBell />}
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
};

export default SocialTopBar;
