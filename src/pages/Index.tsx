import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Search, Users, MapPin, Star, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const features = [
  { icon: Search, title: "Find Gyms & Studios", description: "Discover top-rated gyms and training studios in your area with real reviews and pricing." },
  { icon: Dumbbell, title: "Connect with Trainers", description: "Browse certified personal trainers, view their experience, and send connection requests." },
  { icon: MapPin, title: "Supplement Stores", description: "Locate trusted supplement stores nearby for all your nutrition and performance needs." },
  { icon: Users, title: "Social Community", description: "Share your fitness journey, follow other enthusiasts, and stay motivated together." },
];

const stats = [
  { value: "500+", label: "Gyms Listed", icon: Dumbbell },
  { value: "1,200+", label: "Trainers", icon: Users },
  { value: "50K+", label: "Active Users", icon: TrendingUp },
  { value: "100+", label: "Cities", icon: MapPin },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-background/70" />
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 30% 40%, hsl(90 65% 45% / 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(30 95% 55% / 0.06) 0%, transparent 50%)"
          }} />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <motion.img
            src={logo}
            alt="FitExtremes"
            className="mx-auto mb-6 h-28 w-28 object-contain drop-shadow-2xl md:h-36 md:w-36"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <motion.h1
            className="font-display text-5xl uppercase tracking-wider text-foreground md:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            All-in-One<br />
            <span className="text-gradient-primary">Fitness Platform</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Discover gyms, connect with trainers, find supplements, and join a thriving fitness community — all in one place.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button variant="hero" size="lg" className="animate-pulse-glow" asChild>
              <Link to="/signup?role=user">Join as User</Link>
            </Button>
            <Button variant="accent" size="lg" asChild>
              <Link to="/signup?role=trainer">Join as Trainer</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/signup?role=business">List Your Business</Link>
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-16"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="mx-auto h-6 w-6 text-primary" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="font-display text-3xl uppercase tracking-wider text-foreground md:text-4xl">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-center font-display text-4xl uppercase tracking-wider text-foreground md:text-5xl"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            Everything You <span className="text-gradient-primary">Need</span>
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-xl text-center text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            One platform connecting fitness enthusiasts, trainers, and businesses.
          </motion.p>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 2}
                whileHover={{ y: -4 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl uppercase tracking-wider text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Pros */}
      <section className="border-y border-border py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              className="rounded-xl border border-border bg-card p-8 shadow-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              whileHover={{ scale: 1.02 }}
            >
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
            </motion.div>
            <motion.div
              className="rounded-xl border border-border bg-card p-8 shadow-card"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              whileHover={{ scale: 1.02 }}
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Index;
