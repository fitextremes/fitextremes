import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface FooterProps {
  hidePlatform?: boolean;
  hideForPros?: boolean;
}

const Footer = ({ hidePlatform = false, hideForPros = false }: FooterProps) => {
  const { user } = useAuth();
  const { isSocial } = useUserRole();
  const showDiscover = !!user && isSocial;
  const minimal = hidePlatform && hideForPros;
  return (
    <footer className={`border-t border-border bg-background py-12 ${minimal ? "minimal-footer" : ""}`}>
      <div className="container mx-auto px-4">
        <div className={`grid gap-8 ${minimal ? "md:grid-cols-2" : "md:grid-cols-4"}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="FitExtremes" className="h-8 w-8 object-contain" />
              <span className="font-display text-lg uppercase tracking-wider text-foreground">
                Fit<span className="text-primary">Extremes</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The all-in-one fitness ecosystem. Discover fitness centres, trainers, and supplements near you.
            </p>
          </div>
          {!hidePlatform && (
            <div>
              <h4 className="font-display uppercase tracking-wider text-foreground mb-3">Platform</h4>
              <div className="flex flex-col gap-2">
                {showDiscover && (
                  <>
                    <Link to="/discover" className="text-sm text-muted-foreground hover:text-primary">Discover</Link>
                    <Link to="/calorie-tracker" className="text-sm text-muted-foreground hover:text-primary">Calorie Tracker</Link>
                    <Link to="/workout-log" className="text-sm text-muted-foreground hover:text-primary">Workout Log</Link>
                  </>
                )}
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">About</Link>
                <Link to="/signup" className="text-sm text-muted-foreground hover:text-primary">Join Now</Link>
              </div>
            </div>
          )}
          {!hideForPros && (
            <div>
              <h4 className="font-display uppercase tracking-wider text-foreground mb-3">For Pros</h4>
              <div className="flex flex-col gap-2">
                <Link to="/signup?role=trainer" className="text-sm text-muted-foreground hover:text-primary">Join as Trainer</Link>
                <Link to="/signup?role=business" className="text-sm text-muted-foreground hover:text-primary">List Your Business</Link>
              </div>
            </div>
          )}
          <div>
            <h4 className="font-display uppercase tracking-wider text-foreground mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link to="/legal" className="text-sm text-muted-foreground hover:text-primary">Terms Conditions &amp; Privacy Policies</Link>
              <Link to="/contact-us" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FitExtremes. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
