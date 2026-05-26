import logo from "@/assets/logo.png";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Loading your dashboard..." }: LoadingScreenProps) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
    <img
      src={logo}
      alt="FitExtremes"
      className="h-20 w-20 object-contain animate-pulse"
    />
    <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
    <p className="text-sm text-muted-foreground tracking-wide">{message}</p>
  </div>
);

export default LoadingScreen;
