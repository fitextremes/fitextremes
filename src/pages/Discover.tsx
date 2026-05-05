import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Dumbbell, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { useTrainerList } from "@/hooks/useTrainer";
import { useBusinessList } from "@/hooks/useBusiness";

type Tab = "gyms" | "supplements" | "trainers";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "gyms", label: "Gyms", icon: Dumbbell },
  { key: "supplements", label: "Supplement Stores", icon: ShoppingBag },
  { key: "trainers", label: "Personal Trainers", icon: Star },
];

const mockGyms = [
  { id: 1, name: "Iron Paradise Gym", location: "Toronto, ON", rating: 4.8, type: "Full Gym", image: "🏋️" },
  { id: 2, name: "CrossFit Thunder", location: "Vancouver, BC", rating: 4.6, type: "CrossFit Box", image: "⚡" },
  { id: 3, name: "Zen Fitness Studio", location: "Montreal, QC", rating: 4.9, type: "Boutique Studio", image: "🧘" },
  { id: 4, name: "PowerLift Arena", location: "Calgary, AB", rating: 4.7, type: "Powerlifting", image: "💪" },
  { id: 5, name: "FlexZone", location: "Ottawa, ON", rating: 4.5, type: "24/7 Gym", image: "🔥" },
  { id: 6, name: "Peak Performance", location: "Edmonton, AB", rating: 4.8, type: "Athletic Training", image: "🏔️" },
];

const mockSupplements = [
  { id: 1, name: "NutriMax Store", location: "Toronto, ON", rating: 4.7, type: "Full Range Supplements", image: "💊" },
  { id: 2, name: "Protein Planet", location: "Vancouver, BC", rating: 4.8, type: "Protein & Recovery", image: "🥤" },
  { id: 3, name: "Vitality Health", location: "Calgary, AB", rating: 4.6, type: "Vitamins & Wellness", image: "🌿" },
  { id: 4, name: "MuscleFuel", location: "Montreal, QC", rating: 4.5, type: "Performance Supplements", image: "💪" },
];

const mockTrainers = [
  { id: 1, name: "Alex Carter", location: "Toronto, ON", rating: 5.0, specialty: "Strength & Conditioning", priceMin: 40, priceMax: 60, image: "💪" },
  { id: 2, name: "Maria Santos", location: "Vancouver, BC", rating: 4.9, specialty: "Weight Loss", priceMin: 35, priceMax: 50, image: "🏃" },
  { id: 3, name: "James Wilson", location: "Calgary, AB", rating: 4.8, specialty: "Bodybuilding", priceMin: 45, priceMax: 70, image: "🏋️" },
  { id: 4, name: "Priya Sharma", location: "Montreal, QC", rating: 4.7, specialty: "Yoga & Flexibility", priceMin: 30, priceMax: 45, image: "🧘" },
  { id: 5, name: "Derek Lee", location: "Ottawa, ON", rating: 4.6, specialty: "HIIT & Cardio", priceMin: 25, priceMax: 40, image: "⚡" },
  { id: 6, name: "Samantha Cross", location: "Edmonton, AB", rating: 4.9, specialty: "Powerlifting", priceMin: 50, priceMax: 80, image: "🔥" },
];

const locations = ["All Locations", "Toronto, ON", "Vancouver, BC", "Montreal, QC", "Calgary, AB", "Ottawa, ON", "Edmonton, AB"];
const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $30/hr", min: 0, max: 30 },
  { label: "$30 – $50/hr", min: 30, max: 50 },
  { label: "$50 – $80/hr", min: 50, max: 80 },
  { label: "$80+/hr", min: 80, max: Infinity },
];

const Discover = () => {
  const [activeTab, setActiveTab] = useState<Tab>("gyms");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [priceRange, setPriceRange] = useState(0);
  const { data: realTrainers } = useTrainerList();
  const { data: realBusinesses } = useBusinessList();

  // Merge live DB trainers (use real id) with mocks (use mock id) for trainers tab
  const trainerItems = useMemo(() => {
    const live = (realTrainers || []).map((t: any) => ({
      id: t.id,
      isReal: true,
      name: t.full_name,
      location: t.location || "Canada",
      rating: 5.0,
      specialty: t.bio ? t.bio.slice(0, 60) : "Personal Training",
      priceMin: t.hourly_min ?? 0,
      priceMax: t.hourly_max ?? 999,
      image: "💪",
      avatar_url: t.avatar_url,
    }));
    return [...live, ...mockTrainers.map(t => ({ ...t, isReal: false }))];
  }, [realTrainers]);

  const mapBusiness = (b: any, fallbackImage: string, fallbackType: string) => ({
    id: b.id,
    isReal: true,
    name: b.full_name,
    location: b.location || "Canada",
    rating: 5.0,
    type: b.bio ? b.bio.slice(0, 60) : fallbackType,
    image: fallbackImage,
    avatar_url: b.avatar_url,
  });

  const gymItems = useMemo(() => {
    const live = (realBusinesses || [])
      .filter((b: any) => b.business_type === "gym")
      .map((b: any) => mapBusiness(b, "🏋️", "Gym"));
    return [...live, ...mockGyms.map(g => ({ ...g, isReal: false }))];
  }, [realBusinesses]);

  const supplementItems = useMemo(() => {
    const live = (realBusinesses || [])
      .filter((b: any) => b.business_type === "supplement_store" || b.business_type === "supplements")
      .map((b: any) => mapBusiness(b, "💊", "Supplement Store"));
    return [...live, ...mockSupplements.map(s => ({ ...s, isReal: false }))];
  }, [realBusinesses]);

  const getFilteredItems = () => {
    if (activeTab === "trainers") {
      return trainerItems.filter((t) => {
        const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchLocation = locationFilter === "All Locations" || t.location?.includes(locationFilter.split(",")[0]);
        const range = priceRanges[priceRange];
        const matchPrice = t.priceMin <= range.max && t.priceMax >= range.min;
        return matchSearch && matchLocation && matchPrice;
      });
    }

    const items = activeTab === "gyms" ? gymItems : supplementItems;
    return items.filter((item: any) => {
      const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLocation = locationFilter === "All Locations" || item.location?.includes(locationFilter.split(",")[0]);
      return matchSearch && matchLocation;
    });
  };

  const items = getFilteredItems();

  return (
    <div className="min-h-screen bg-background pb-20">
      <SocialTopBar title="Discover" />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <p className="text-muted-foreground">Find gyms, supplement stores, and personal trainers near you</p>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
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

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === "trainers" ? "Search by name or specialty..." : "Search by name..."}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeTab === "trainers" && (
            <Select value={String(priceRange)} onValueChange={(v) => setPriceRange(Number(v))}>
              <SelectTrigger className="w-full sm:w-48">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((r, i) => (
                  <SelectItem key={i} value={String(i)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-2xl overflow-hidden">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  item.image
                )}
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
                {item.specialty || item.type}
              </p>
              {activeTab === "trainers" && (
                <p className="mt-1 text-sm font-semibold text-primary">${item.priceMin}–${item.priceMax} CAD/hr</p>
              )}
              <Button variant="hero" size="sm" className="mt-4 w-full" asChild>
                <Link to={`/${activeTab === "trainers" ? "trainer" : "business"}/${item.id}`}>View Profile</Link>
              </Button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">No results found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
};

export default Discover;
