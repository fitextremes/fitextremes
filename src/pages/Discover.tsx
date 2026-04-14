import { useState } from "react";
import { Search, MapPin, Star, Dumbbell, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Tab = "gyms" | "trainers" | "supplements";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "gyms", label: "Gyms", icon: Dumbbell },
  { key: "trainers", label: "Trainers", icon: Star },
  { key: "supplements", label: "Supplements", icon: ShoppingBag },
];

const mockGyms = [
  { id: 1, name: "Iron Paradise Gym", location: "Toronto, ON", rating: 4.8, type: "Full Gym", image: "🏋️" },
  { id: 2, name: "CrossFit Thunder", location: "Vancouver, BC", rating: 4.6, type: "CrossFit Box", image: "⚡" },
  { id: 3, name: "Zen Fitness Studio", location: "Montreal, QC", rating: 4.9, type: "Boutique Studio", image: "🧘" },
  { id: 4, name: "PowerLift Arena", location: "Calgary, AB", rating: 4.7, type: "Powerlifting", image: "💪" },
  { id: 5, name: "FlexZone", location: "Ottawa, ON", rating: 4.5, type: "24/7 Gym", image: "🔥" },
  { id: 6, name: "Peak Performance", location: "Edmonton, AB", rating: 4.8, type: "Athletic Training", image: "🏔️" },
];

const mockTrainers = [
  { id: 1, name: "Alex Carter", location: "Toronto, ON", rating: 5.0, specialty: "Strength & Conditioning", rate: "$40–$60/hr", image: "💪" },
  { id: 2, name: "Maria Santos", location: "Vancouver, BC", rating: 4.9, specialty: "Weight Loss", rate: "$35–$50/hr", image: "🏃" },
  { id: 3, name: "James Wilson", location: "Calgary, AB", rating: 4.8, specialty: "Bodybuilding", rate: "$45–$70/hr", image: "🏋️" },
  { id: 4, name: "Priya Sharma", location: "Montreal, QC", rating: 4.7, specialty: "Yoga & Flexibility", rate: "$30–$45/hr", image: "🧘" },
];

const mockSupplements = [
  { id: 1, name: "NutriMax Store", location: "Toronto, ON", rating: 4.7, type: "Full Range Supplements", image: "💊" },
  { id: 2, name: "Protein Planet", location: "Vancouver, BC", rating: 4.8, type: "Protein & Recovery", image: "🥤" },
  { id: 3, name: "Vitality Health", location: "Calgary, AB", rating: 4.6, type: "Vitamins & Wellness", image: "🌿" },
];

const Discover = () => {
  const [activeTab, setActiveTab] = useState<Tab>("gyms");
  const [searchQuery, setSearchQuery] = useState("");

  const getItems = () => {
    const items = activeTab === "gyms" ? mockGyms : activeTab === "trainers" ? mockTrainers : mockSupplements;
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const items = getItems();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-4xl uppercase tracking-wider text-foreground md:text-5xl">
          <span className="text-gradient-primary">Discover</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Find gyms, trainers, and supplement stores near you</p>

        {/* Tabs */}
        <div className="mt-8 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-display text-sm uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-2xl">
                {item.image}
              </div>
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground">{item.name}</h3>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {item.location}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-accent">
                <Star className="h-3 w-3 fill-current" />
                {item.rating}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {"specialty" in item ? item.specialty : "type" in item ? item.type : ""}
              </p>
              {"rate" in item && (
                <p className="mt-1 text-sm font-semibold text-primary">{item.rate}</p>
              )}
              <Button variant="hero" size="sm" className="mt-4 w-full">
                View Profile
              </Button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">No results found</p>
            <p className="text-sm">Try a different search term or location</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Discover;
