import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useBusinessGallery, useUploadBusinessGalleryImage, useDeleteBusinessGalleryImage } from "@/hooks/useBusiness";
import { toast } from "sonner";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;
const LIMIT = 10;

const BusinessGallery = () => {
  const { user } = useAuth();
  const { isBusiness, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: gallery = [], isLoading } = useBusinessGallery(user?.id);
  const upload = useUploadBusinessGalleryImage();
  const del = useDeleteBusinessGalleryImage();

  if (!roleLoading && user && !isBusiness) { navigate("/dashboard"); return null; }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (gallery.length + files.length > LIMIT) {
      toast.error(`You can have up to ${LIMIT} photos. Delete some first.`);
      return;
    }
    for (const f of files) {
      if (!ACCEPTED.includes(f.type)) { toast.error(`${f.name}: only JPG/PNG/WEBP allowed`); continue; }
      if (f.size > MAX) { toast.error(`${f.name}: image must be 5 MB or less`); continue; }
      try {
        await upload.mutateAsync(f);
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
    }
    e.target.value = "";
    toast.success("Photos updated");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-3xl">
          <button onClick={() => navigate("/business-dashboard")} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-display text-lg uppercase tracking-wider">Manage Photos</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{gallery.length}/{LIMIT} photos</p>
            <Button onClick={() => fileRef.current?.click()} variant="hero" size="sm" disabled={gallery.length >= LIMIT}>
              <ImagePlus className="h-3 w-3 mr-1" /> Upload
            </Button>
            <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={onFile} className="hidden" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : gallery.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No photos yet. Upload up to {LIMIT} photos to showcase your space.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((g: any) => (
                <div key={g.id} className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-secondary">
                  <img src={g.image_url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => del.mutate(g.id)} className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessGallery;
