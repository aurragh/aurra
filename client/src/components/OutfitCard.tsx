import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  Camera,
  Share2,
  Shuffle,
  ImageOff,
} from "lucide-react";

interface OutfitCardProps {
  outfit: any;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onShop: (id: string) => void;
  onTryOn: (id: string) => void;
  onShare: (id: string) => void;
  onRemix: (outfit: any) => void;
  onImageClick: (url: string, name: string) => void;
  onGenerateAnother?: (occasion: string) => void;
  isFavoritePending?: boolean;
  isDeletePending?: boolean;
  isGenerating?: boolean;
}

// Replace em dashes in any displayed string (Claude sometimes outputs them).
function clean(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\s—\s/g, ", ").replace(/—/g, ",");
}

export function OutfitCard({
  outfit,
  onFavorite,
  onDelete,
  onShop,
  onTryOn,
  onShare,
  onRemix,
  onImageClick,
  isFavoritePending,
  isDeletePending,
}: OutfitCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [primaryImgError, setPrimaryImgError] = useState(false);

  const hasDetails = outfit.backupRecommendation || outfit.avoidRecommendation;

  // Image fallback chain: local imageUrl -> Replicate dalleUrl -> placeholder.
  // Render's free tier has ephemeral disk, so local files may be wiped on redeploy.
  const activeImageUrl = useMemo(() => {
    if (!primaryImgError && outfit.imageUrl) return outfit.imageUrl;
    if (outfit.dalleUrl) return outfit.dalleUrl;
    return null;
  }, [outfit.imageUrl, outfit.dalleUrl, primaryImgError]);

  const primary = clean(outfit.primaryRecommendation);
  const why = clean(outfit.whyRecommendation);
  const backup = clean(outfit.backupRecommendation);
  const avoid = clean(outfit.avoidRecommendation);

  return (
    <div
      className="max-w-lg mx-auto w-full rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-400/25 hover:shadow-[0_12px_40px_rgba(124,58,237,0.18)] hover:-translate-y-0.5"
      data-testid={`card-outfit-${outfit.id}`}
      style={{
        background: "linear-gradient(180deg, #1A1825 0%, #15101e 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ─── Hero image ─── */}
      {activeImageUrl ? (
        <div
          className="relative w-full cursor-pointer group"
          onClick={() => onImageClick(activeImageUrl, outfit.name)}
          data-testid={`img-container-${outfit.id}`}
        >
          <img
            src={activeImageUrl}
            alt={outfit.name}
            className="w-full object-cover h-[440px] transition-transform duration-700 group-hover:scale-[1.02]"
            data-testid={`img-outfit-${outfit.id}`}
            onError={() => setPrimaryImgError(true)}
          />
          {/* Bottom gradient for readable badges */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(15,14,20,0.85), transparent)" }}
          />
          {outfit.occasion && (
            <span
              className="absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full font-medium tracking-wide"
              style={{
                background: "rgba(15,14,20,0.7)",
                backdropFilter: "blur(8px)",
                color: "#e2d9f3",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              data-testid={`badge-occasion-${outfit.id}`}
            >
              {outfit.occasion}
            </span>
          )}
          <span
            className="absolute top-3 right-3 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium tracking-wide"
            style={{
              background: "rgba(124,58,237,0.5)",
              backdropFilter: "blur(8px)",
              color: "#f5f3ff",
              border: "1px solid rgba(168,85,247,0.4)",
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI Exclusive
          </span>
        </div>
      ) : (
        <div
          className="w-full h-48 flex flex-col items-center justify-center gap-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(168,85,247,0.02)), repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.015) 8px 9px)",
          }}
        >
          {outfit.imageUrl || outfit.dalleUrl ? (
            <>
              <ImageOff className="w-5 h-5 text-purple-300/40" />
              <p className="text-purple-300/50 text-[11px] uppercase tracking-wider">Image unavailable</p>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
              <p className="text-purple-300/60 text-[11px] uppercase tracking-wider">Generating image…</p>
            </>
          )}
        </div>
      )}

      {/* ─── Primary recommendation (only when Details is collapsed) ─── */}
      {!showDetails && primary && (
        <div className="px-6 pt-5 pb-3">
          <p
            className="text-white/90 text-[15px] font-serif italic leading-[1.55]"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            {primary}
          </p>
        </div>
      )}

      {/* ─── Details panel (BACKUP + AVOID): replaces primary, no redundancy ─── */}
      {showDetails && hasDetails && (
        <div className="px-6 pt-5 pb-3 space-y-4">
          {primary && (
            <div>
              <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-[0.14em] mb-1.5">
                Primary direction
              </p>
              <p className="text-white/90 text-[14px] leading-relaxed">{primary}</p>
            </div>
          )}
          {backup && (
            <div>
              <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-[0.14em] mb-1.5">
                Backup direction
              </p>
              <p className="text-gray-300 text-[14px] leading-relaxed">{backup}</p>
            </div>
          )}
          {avoid && (
            <div>
              <p className="text-[10px] font-semibold text-rose-300/70 uppercase tracking-[0.14em] mb-1.5">
                Avoid
              </p>
              <p className="text-gray-300 text-[14px] leading-relaxed">{avoid}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Why this works (toggle) ─── */}
      {showWhy && why && (
        <div className="mx-6 mb-3">
          <div
            className="px-4 py-3 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))",
              border: "1px solid rgba(139,92,246,0.18)",
            }}
          >
            <p className="text-purple-100/85 text-[13px] italic leading-relaxed">{why}</p>
          </div>
        </div>
      )}

      {/* ─── Action chips ─── */}
      <div className="px-5 pt-2 pb-3 flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onFavorite(outfit.id)}
          disabled={isFavoritePending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95"
          style={{
            background: outfit.isFavorite ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${outfit.isFavorite ? "rgba(236,72,153,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: outfit.isFavorite ? "#f9a8d4" : "#a1a1aa",
          }}
          data-testid={`button-favorite-${outfit.id}`}
        >
          <Heart className={`w-3 h-3 ${outfit.isFavorite ? "fill-pink-400 text-pink-400" : ""}`} />
          {outfit.isFavorite ? "Saved" : "Save"}
        </button>

        {why && (
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95"
            style={{
              background: showWhy ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${showWhy ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showWhy ? "#c4b5fd" : "#a1a1aa",
            }}
          >
            <Info className="w-3 h-3" />
            Why this works
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onRemix(outfit)}
            className="p-1.5 rounded-full transition-colors hover:bg-purple-500/15 group"
            data-testid={`button-remix-${outfit.id}`}
            title="Remix this look"
          >
            <Shuffle className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition-colors" />
          </button>
          <button
            onClick={() => onShare(outfit.id)}
            className="p-1.5 rounded-full transition-colors hover:bg-blue-500/15 group"
            data-testid={`button-share-${outfit.id}`}
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            onClick={() => onDelete(outfit.id)}
            disabled={isDeletePending}
            className="p-1.5 rounded-full transition-colors hover:bg-red-500/15 group"
            data-testid={`button-delete-${outfit.id}`}
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
          </button>
          {hasDetails && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 ml-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95"
              style={{
                background: showDetails ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#a1a1aa",
              }}
            >
              Details
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* ─── Primary CTAs ─── */}
      <div
        className="px-5 pt-3 pb-5 flex gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <button
          onClick={() => onTryOn(outfit.id)}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/[0.08] active:scale-[0.99]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e5e7eb",
          }}
          data-testid={`button-tryon-${outfit.id}`}
        >
          <Camera className="w-4 h-4" />
          Try It On
        </button>
        <button
          onClick={() => onShop(outfit.id)}
          className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            boxShadow: "0 6px 20px rgba(124,58,237,0.3)",
          }}
          data-testid={`button-shop-${outfit.id}`}
        >
          <ShoppingBag className="w-4 h-4" />
          Shop
        </button>
      </div>
    </div>
  );
}
