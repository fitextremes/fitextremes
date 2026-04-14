import { Dumbbell, Users, MapPin, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <img src={logo} alt="FitExtremes" className="mx-auto h-24 w-24 object-contain mb-6" />
            <h1 className="font-display text-4xl uppercase tracking-wider text-foreground md:text-5xl">
              About <span className="text-gradient-primary">FitExtremes</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The all-in-one fitness ecosystem connecting users, trainers, and businesses.
            </p>
          </div>

          <div className="space-y-8">
            <div className="rounded-xl border border-border bg-card p-8 shadow-card">
              <h2 className="font-display text-2xl uppercase tracking-wider text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                FitExtremes is a next-generation digital fitness platform designed to bring the entire fitness experience
                into one seamless ecosystem. We connect individuals with fitness services, resources, and like-minded
                people — making it easier than ever to achieve your health goals.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                { icon: MapPin, title: "Nearby Services", desc: "Discover gyms, studios, and trainers based on your location." },
                { icon: Dumbbell, title: "Supplement Stores", desc: "Find trusted supplement stores for health and performance." },
                { icon: Users, title: "Social Community", desc: "Share progress, follow enthusiasts, and stay motivated." },
                { icon: Target, title: "Fitness Tracker", desc: "Coming soon — log workouts, track calories, monitor progress." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <item.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-display text-lg uppercase tracking-wider text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
              <h2 className="font-display text-2xl uppercase tracking-wider text-foreground mb-4">Ready to Start?</h2>
              <p className="text-muted-foreground mb-6">
                Whether you're a fitness enthusiast, a personal trainer, or a business owner — FitExtremes has a place for you.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">Join FitExtremes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
