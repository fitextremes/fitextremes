import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { useIncomingFollowRequests } from "@/hooks/useFollowRequest";
import { useUserRole } from "@/hooks/useUserRole";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.png";

interface SocialTopBarProps {
  title: "Feed" | "Explore" | "Discover" | "Profile";
}

const SocialTopBar = ({ title }: SocialTopBarProps) => {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { isSocial } = useUserRole();
  const { data: requests } = useIncomingFollowRequests();
  const pendingCount = isSocial ? requests?.length || 0 : 0;

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
            {isSocial && (
              <Link
                to="/follow-requests"
                className="relative text-muted-foreground hover:text-primary transition-colors"
                title="Follow requests"
                aria-label="Follow requests"
              >
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}
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
