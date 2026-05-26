import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Discover from "./pages/Discover";
import Explore from "./pages/Explore";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import UserProfile from "./pages/UserProfile";
import FollowRequests from "./pages/FollowRequests";
import Notifications from "./pages/Notifications";
import TrainerProfile from "./pages/TrainerProfile";
import BusinessPublicProfile from "./pages/BusinessPublicProfile";
import TrainerDashboard from "./pages/TrainerDashboard";
import TrainerEditProfile from "./pages/TrainerEditProfile";
import TrainerGallery from "./pages/TrainerGallery";
import TrainerBilling from "./pages/TrainerBilling";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessEditProfile from "./pages/BusinessEditProfile";
import BusinessGallery from "./pages/BusinessGallery";
import NotFound from "./pages/NotFound";
import CheckoutReturn from "./pages/CheckoutReturn";
import BusinessCheckout from "./pages/BusinessCheckout";
import CalorieTracker from "./pages/CalorieTracker";
import WorkoutLog from "./pages/WorkoutLog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";
import ContactUs from "./pages/ContactUs";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaymentTestModeBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/user/:identifier" element={<UserProfile />} />
            <Route path="/follow-requests" element={<FollowRequests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/edit" element={<TrainerEditProfile />} />
            <Route path="/profile/gallery" element={<TrainerGallery />} />
            <Route path="/trainer/billing" element={<TrainerBilling />} />
            <Route path="/trainer/:id" element={<TrainerProfile />} />
            <Route path="/business" element={<Navigate to="/login?role=business" replace />} />
            <Route path="/business/profile/public-preview" element={<BusinessPublicProfile />} />
            <Route path="/business/:id" element={<BusinessPublicProfile />} />
            <Route path="/business-dashboard" element={<BusinessDashboard />} />
            <Route path="/business/edit" element={<BusinessEditProfile />} />
            <Route path="/business/gallery" element={<BusinessGallery />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/business-checkout" element={<BusinessCheckout />} />
            <Route path="/calorie-tracker" element={<CalorieTracker />} />
            <Route path="/workout-log" element={<WorkoutLog />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/terms" element={<Navigate to="/legal#terms" replace />} />
            <Route path="/privacy" element={<Navigate to="/legal#privacy" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
