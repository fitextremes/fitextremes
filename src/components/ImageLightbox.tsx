import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ImageOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLightboxProps {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
}

const ImageLightbox = ({ open, src, alt = "Image", onClose }: ImageLightboxProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(false);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, src, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
          onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (touchStartY == null) return;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (dy > 80) onClose();
            setTouchStartY(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {loading && !error && (
            <Loader2 className="absolute h-10 w-10 animate-spin text-primary" />
          )}

          {error ? (
            <div
              className="flex flex-col items-center gap-3 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageOff className="h-12 w-12" />
              <p className="text-sm">Unable to load image</p>
            </div>
          ) : (
            <motion.img
              key={src}
              src={src}
              alt={alt}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: loading ? 0 : 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ImageLightbox;
