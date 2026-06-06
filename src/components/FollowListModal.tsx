import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}

const FollowListModal = ({ open, onOpenChange, userId, type }: FollowListModalProps) => {
  const { data: users, isLoading } = useQuery({
    queryKey: [type, userId, "list"],
    queryFn: async () => {
      if (!userId) return [];
      const selectCol = type === "followers" ? "follower_id" : "following_id";
      const filterCol = type === "followers" ? "following_id" : "follower_id";

      const { data: rows, error: followsErr } = await supabase
        .from("follows")
        .select(selectCol)
        .eq(filterCol, userId);
      if (followsErr) throw followsErr;

      const ids = (rows || []).map((r: any) => r[selectCol]).filter(Boolean);
      if (ids.length === 0) return [];

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids);
      if (profErr) throw profErr;
      return profiles || [];
    },
    enabled: open && !!userId,
    retry: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-4">Loading...</p>
          ) : users && users.length > 0 ? (
            users.map((u: any) => (
              <Link
                key={u.id}
                to={`/user/${u.username || u.id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-display text-muted-foreground">
                      {u.full_name?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListModal;
