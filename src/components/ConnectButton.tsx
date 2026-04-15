import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnectRequest } from "@/hooks/useConnectRequest";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ConnectButtonProps {
  targetType: "trainer" | "gym" | "supplement";
  targetId: string;
  targetName: string;
  variant?: "hero" | "accent";
}

const ConnectButton = ({ targetType, targetId, targetName, variant = "hero" }: ConnectButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { existingRequest, send } = useConnectRequest(targetType, targetId);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    try {
      await send.mutateAsync(message);
      toast.success("Request sent successfully!");
      setOpen(false);
      setMessage("");
    } catch {
      toast.error("Failed to send request. You may have already sent one.");
    }
  };

  if (!user) {
    return (
      <Button variant={variant} className="w-full" size="lg" onClick={() => navigate("/login")}>
        Login to Connect
      </Button>
    );
  }

  if (existingRequest) {
    return (
      <div className="rounded-lg bg-primary/10 p-4 text-center">
        <p className="text-sm text-primary font-semibold">✓ Request sent!</p>
        <p className="text-xs text-muted-foreground mt-1">Status: Pending</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant={variant} className="w-full" size="lg" onClick={() => setOpen(true)}>
        Connect with {targetName}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 100))}
        placeholder="Hi, I'm interested in your services..."
        className="w-full rounded-lg border border-border bg-secondary p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
        rows={3}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{message.length}/100</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setMessage(""); }}>
            Cancel
          </Button>
          <Button variant={variant} size="sm" onClick={handleSend} disabled={!message.trim() || send.isPending}>
            <Send className="h-3 w-3 mr-1" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectButton;
