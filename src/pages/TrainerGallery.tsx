import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Trash2, Star, GripVertical, Loader2, ImagePlus } from "lucide-react";
import SocialTopBar from "@/components/SocialTopBar";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useTrainerGallery,
  useUploadGalleryImages,
  useDeleteGalleryImage,
  useReorderGallery,
  useSetFeaturedImage,
  useUpdateCaption,
  GALLERY_LIMITS,
  type GalleryItem,
} from "@/hooks/useTrainerGallery";
import { toast } from "sonner";

const TrainerGallery = () => {
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: items = [] } = useTrainerGallery(user?.id);
  const upload = useUploadGalleryImages();
  const del = useDeleteGalleryImage();
  const reorder = useReorderGallery();
  const setFeatured = useSetFeaturedImage();
  const updateCaption = useUpdateCaption();
  const [dragId, setDragId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?role=trainer");
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (!roleLoading && user && !isTrainer) navigate("/dashboard");
  }, [roleLoading, isTrainer, user, navigate]);

  const list = localOrder ?? items;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await upload.mutateAsync(Array.from(files));
      toast.success("Photos uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const arr = [...list];
    const from = arr.findIndex((x) => x.id === dragId);
    const to = arr.findIndex((x) => x.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setLocalOrder(arr);
    setDragId(null);
    try {
      await reorder.mutateAsync(arr.map((i) => i.id));
      toast.success("Order saved");
    } catch (e: any) {
      toast.error(e.message || "Could not save order");
      setLocalOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <SocialTopBar title="Profile" />
      <div className="container mx-auto px-4 pt-20 max-w-5xl space-y-6">
        <Link
          to="/trainer-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                Workout Gallery
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length}/{GALLERY_LIMITS.MAX_IMAGES} photos · JPG, PNG, WEBP · max 5 MB each
              </p>
            </div>
            <Button
              variant="hero"
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending || items.length >= GALLERY_LIMITS.MAX_IMAGES}
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4 mr-2" />
              )}
              Add Photos
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </motion.div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No photos yet. Click Add Photos to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {list.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(item.id)}
                className="group relative rounded-2xl overflow-hidden border border-border bg-card shadow-card"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.caption || "Gallery photo"}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {item.is_featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                    <Star className="h-3 w-3" /> Cover
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className="rounded-md bg-background/80 p-1.5 text-foreground hover:bg-background cursor-grab"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                  {!item.is_featured && (
                    <button
                      type="button"
                      onClick={() => setFeatured.mutate(item.id)}
                      className="rounded-md bg-background/80 p-1.5 text-foreground hover:bg-primary hover:text-primary-foreground"
                      aria-label="Set as cover"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Delete this photo?")) return;
                      try {
                        await del.mutateAsync(item);
                        toast.success("Photo deleted");
                      } catch (e: any) {
                        toast.error(e.message || "Delete failed");
                      }
                    }}
                    className="rounded-md bg-background/80 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-2">
                  <Input
                    defaultValue={item.caption ?? ""}
                    placeholder="Caption (optional)"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (item.caption ?? "")) {
                        updateCaption.mutate({ id: item.id, caption: v });
                      }
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <MobileTabBar />
    </div>
  );
};

export default TrainerGallery;
