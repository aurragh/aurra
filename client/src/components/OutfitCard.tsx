import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Camera,
  Share2,
  Shuffle,
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

function clean(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\s—\s/g, ", ").replace(/—/g, ",");
}

/** Pull a short headline from the primary recommendation (first phrase before comma/period). */
function headline(s: string): string {
  if (!s) return "";
  const first = s.split(/[.,;:]/)[0]?.trim() ?? "";
  if (first.length <= 60) return first;
  // Fallback: truncate cleanly
  return first.slice(0, 58).trim() + "…";
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
  const [expanded, setExpanded] = useState(false);
  const [primaryImgError, setPrimaryImgError] = useState(false);

  // imageUrl (local on Render disk) -> dalleUrl (Replicate, ~24h) -> placeholder
  const activeImageUrl = useMemo(() => {
    if (!primaryImgError && outfit.imageUrl) return outfit.imageUrl;
    if (outfit.dalleUrl) return outfit.dalleUrl;
    return null;
  }, [outfit.imageUrl, outfit.dalleUrl, primaryImgError]);

  const primary = clean(outfit.primaryRecommendation);
  const why = clean(outfit.whyRecommendation);
  const backup = clean(outfit.backupRecommendation);
  const avoid = clean(outfit.avoidRecommendation);
  const title = headline(primary) || outfit.name || "Look";

  return (
    <div
      className="max-w-lg mx-auto w-full rounded-3xl overflow-hidden transition-all duration-300 hover:border-purple-400/25 hover:shadow-[0_12px_40px_rgba(124,58,237,0.18)] hover:-translate-y-0.5"
      data-testid={`card-outfit-${outfit.id}`}
      style={{
        background: "linear-gradient(180deg, #1A1825 0%, #15101e 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ─── Hero image with overlay heart ─── */}
      <div className="relative w-full">
        {activeImageUrl ? (
          <div
            className="relative w-full cursor-pointer group"
            onClick={() => onImageClick(activeImageUrl, outfit.name)}
            data-testid={`img-container-${outfit.id}`}
          >
            <img
              src={activeImageUrl}
              alt={title}
              className="w-full object-cover h-[440px] transition-transform duration-700 group-hover:scale-[1.02]"
              data-testid={`img-outfit-${outfit.id}`}
              onError={() => setPrimaryImgError(true)}
            />
            {/* Top bottom gradient for legibility of overlays */}
            <div
              className="absolute inset-x-0 top-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(15,14,20,0.7), transparent)" }}
            />
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
          </div>
        ) : (
          // Styled placeholder when no image at all
          <div
            className="w-full h-[440px] flex flex-col items-center justify-center gap-3 px-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.04)), repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.015) 12px 13px)",
            }}
          >
            <div className="w-12 h-12 rounded-full border border-purple-300/20 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              />
            </div>
            {outfit.occasion && (
              <p className="text-purple-200/60 text-xs uppercase tracking-[0.2em]">{outfit.occasion}</p>
            )}
            {title && (
              <p
                className="text-white/85 text-center text-sm font-serif italic max-w-xs leading-snug"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                {title}
              </p>
            )}
          </div>
        )}

        {/* Heart save: top-right overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(outfit.id);
          }}
          disabled={isFavoritePending}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 hover:scale-110"
          style={{
            background: outfit.isFavorite ? "rgba(236,72,153,0.85)" : "rgba(15,14,20,0.6)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${outfit.isFavorite ? "rgba(236,72,153,0.5)" : "rgba(255,255,255,0.1)"}`,
          }}
          data-testid={`button-favorite-${outfit.id}`}
          aria-label={outfit.isFavorite ? "Unsave" : "Save"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              outfit.isFavorite ? "fill-white text-white" : "text-white/80"
            }`}
          />
        </button>
      </div>

      {/* ─── Compact info row: title + actions ─── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-white/95 text-base font-serif italic leading-snug line-clamp-2"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            {title}
          </p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onRemix(outfit)}
            className="p-2 rounded-full transition-colors hover:bg-purple-500/15 active:bg-purple-500/20 group"
            title="Remix this look"
          >
            <Shuffle className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition-colors" />
          </button>
          <button
            onClick={() => onShare(outfit.id)}
            className="p-2 rounded-full transition-colors hover:bg-blue-500/15 active:bg-blue-500/20 group"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            onClick={() => onDelete(outfit.id)}
            disabled={isDeletePending}
            className="p-2 rounded-full transition-colors hover:bg-red-500/15 active:bg-red-500/20 group"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* ─── Expandable details panel (everything goes here) ─── */}
      {expanded && (
        <div className="px-5 pb-1 space-y-4 animate-in fade-in duration-200">
          {primary && primary !== title && (
            <Section label="Direction">{primary}</Section>
          )}
          {why && <Section label="Why this works" tone="purple">{why}</Section>}
          {backup && <Section label="Backup">{backup}</Section>}
          {avoid && <Section label="Avoid" tone="rose">{avoid}</Section>}
        </div>
      )}

      {/* ─── Single toggle for full details ─── */}
      {(primary || why || backup || avoid) && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-purple-300/70 hover:text-purple-200 transition-colors flex items-center gap-1"
          >
            {expanded ? (
              <>
                Hide details <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Why this works <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ─── Primary CTAs ─── */}
      <div className="px-5 pt-3 pb-5 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
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

function Section({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "default" | "purple" | "rose";
}) {
  const colors = {
    default: { label: "text-gray-400/80", body: "text-gray-300", bg: "transparent" },
    purple: {
      label: "text-purple-300/80",
      body: "text-purple-100/90",
      bg: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))",
    },
    rose: { label: "text-rose-300/80", body: "text-rose-100/85", bg: "transparent" },
  }[tone];

  return (
    <div
      className="rounded-2xl"
      style={{
        background: colors.bg,
        padding: colors.bg !== "transparent" ? "12px 14px" : "0",
        border: colors.bg !== "transparent" ? "1px solid rgba(139,92,246,0.18)" : "none",
      }}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5 ${colors.label}`}>
        {label}
      </p>
      <p className={`text-[13px] leading-relaxed ${colors.body}`}>{children}</p>
    </div>
  );
}
