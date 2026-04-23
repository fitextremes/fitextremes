import Navbar from "@/components/Navbar";
import SocialTopBar from "@/components/SocialTopBar";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileViewHeaderProps {
  title?: "Feed" | "Explore" | "Discover" | "Profile";
}

/**
 * Header shown on in-app profile detail pages.
 * - Logged-in users: app-style SocialTopBar (no public Home/Discover/About/Dashboard nav)
 * - Logged-out users: public Navbar
 */
const ProfileViewHeader = ({ title = "Profile" }: ProfileViewHeaderProps) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-14" />;
  return user ? <SocialTopBar title={title} /> : <Navbar />;
};

export default ProfileViewHeader;
