import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FitExtremes" className="h-10 w-10 object-contain" />
          <span className="font-display text-xl uppercase tracking-wider text-foreground">
            Fit<span className="text-primary">Extremes</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/discover" className="text-sm text-muted-foreground transition-colors hover:text-primary">
            Discover
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-primary">
            About
          </Link>
          <div className="relative">
            <button
              onClick={() => setLoginOpen(!loginOpen)}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Login <ChevronDown className="h-3 w-3" />
            </button>
            {loginOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card p-2 shadow-card">
                <Link
                  to="/login?role=user"
                  className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
                  onClick={() => setLoginOpen(false)}
                >
                  Social User
                </Link>
                <Link
                  to="/login?role=trainer"
                  className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
                  onClick={() => setLoginOpen(false)}
                >
                  Personal Trainer
                </Link>
                <Link
                  to="/login?role=business"
                  className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
                  onClick={() => setLoginOpen(false)}
                >
                  Business Owner
                </Link>
              </div>
            )}
          </div>
          <Button variant="hero" size="sm" asChild>
            <Link to="/signup">Join Now</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/discover" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Discover</Link>
            <Link to="/about" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>About</Link>
            <Link to="/login?role=user" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Login as User</Link>
            <Link to="/login?role=trainer" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Login as Trainer</Link>
            <Link to="/login?role=business" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Login as Business</Link>
            <Button variant="hero" size="sm" asChild>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>Join Now</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
