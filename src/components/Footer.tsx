import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

interface FooterProps {
  hidePlatform?: boolean;
  hideForPros?: boolean;
}

const Footer = ({ hidePlatform = false, hideForPros = false }: FooterProps) => {
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
              The all-in-one fitness ecosystem. Discover gyms, trainers, and supplements near you.
            </p>
          </div>
          {!hidePlatform && (
            <div>
              <h4 className="font-display uppercase tracking-wider text-foreground mb-3">Platform</h4>
              <div className="flex flex-col gap-2">
                <Link to="/discover" className="text-sm text-muted-foreground hover:text-primary">Discover</Link>
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
              <span className="text-sm text-muted-foreground">Terms of Service</span>
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Contact Us</span>
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
