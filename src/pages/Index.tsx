import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Search, Users, MapPin, Star, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const features = [
  {
    icon: Search,
    title: "Find Gyms & Studios",
    description: "Discover top-rated gyms and training studios in your area with real reviews and pricing.",
  },
  {
    icon: Dumbbell,
    title: "Connect with Trainers",
    description: "Browse certified personal trainers, view their experience, and send connection requests.",
  },
  {
    icon: MapPin,
    title: "Supplement Stores",
    description: "Locate trusted supplement stores nearby for all your nutrition and performance needs.",
  },
  {
    icon: Users,
    title: "Social Community",
    description: "Share your fitness journey, follow other enthusiasts, and stay motivated together.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-hero pt-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, hsl(90 65% 45% / 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(30 95% 55% / 0.1) 0%, transparent 50%)"
          }} />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <img src={logo} alt="FitExtremes" className="mx-auto mb-8 h-32 w-32 animate-fade-in object-contain drop-shadow-2xl" />
          <h1 className="font-display text-5xl uppercase tracking-wider text-foreground md:text-7xl lg:text-8xl animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            All-in-One<br />
            <span className="text-gradient-primary">Fitness Platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
            Discover gyms, connect with trainers, find supplements, and join a thriving fitness community — all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup?role=user">Join as User</Link>
            </Button>
            <Button variant="accent" size="lg" asChild>
              <Link to="/signup?role=trainer">Join as Trainer</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/signup?role=business">List Your Business</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-4xl uppercase tracking-wider text-foreground md:text-5xl">
            Everything You <span className="text-gradient-primary">Need</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            One platform connecting fitness enthusiasts, trainers, and businesses.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow animate-fade-in"
                style={{ animationDelay: `${0.1 * i}s`, opacity: 0 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl uppercase tracking-wider text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Pros */}
      <section className="border-y border-border py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl uppercase tracking-wider text-foreground">Personal Trainers</h3>
              <p className="mt-2 text-muted-foreground">
                Showcase your expertise, receive leads, and grow your client base. First month free, then $15/month.
              </p>
              <Button variant="hero" className="mt-6" asChild>
                <Link to="/signup?role=trainer">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-accent">
                <Star className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl uppercase tracking-wider text-foreground">Business Owners</h3>
              <p className="mt-2 text-muted-foreground">
                List your gym, studio, or supplement store and connect with potential customers. First month free, then $30/month.
              </p>
              <Button variant="accent" className="mt-6" asChild>
                <Link to="/signup?role=business">
                  List Your Business <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
