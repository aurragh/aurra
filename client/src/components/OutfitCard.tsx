import { useState } from "react";
import { ShoppingBag, Heart, Info, ChevronDown, ChevronUp, Trash2, Sparkles, Camera } from "lucide-react";

interface OutfitCardProps {
  outfit: any;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onShop: (id: string) => void;
  onTryOn: (id: string) => void;
  onImageClick: (url: string, name: string) => void;
  onGenerateAnother?: (occasion: string) => void;
  isFavoritePending?: boolean;
  isDeletePending?: boolean;
  isGenerating?: boolean;
}

export function OutfitCard({
  outfit,
  onFavorite,
  onDelete,
  onShop,
  onTryOn,
  onImageClick,
  isFavoritePending,
  isDeletePending,
}: OutfitCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasDetails = outfit.backupRecommendation || outfit.avoidRecommendation;

  return (
    <div
      className="max-w-lg mx-auto w-full rounded-2xl overflow-hidden"
      data-testid={`card-outfit-${outfit.id}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header: primary recommendation + delete */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        {outfit.primaryRecommendation ? (
          <p className="text-white/90 text-base font-serif italic leading-relaxed flex-1">
            {outfit.primaryRecommendation}
          </p>
        ) : (
          <p className="text-gray-400 text-sm flex-1">{outfit.name}</p>
        )}
        <button
          onClick={() => onDelete(outfit.id)}
          disabled={isDeletePending}
          className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-red-500/15 group mt-0.5"
          data-testid={`button-delete-${outfit.id}`}
          title="Remove look"
        >
          <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Image */}
      {outfit.imageUrl ? (
        <div
          className="relative w-full cursor-pointer"
          onClick={() => onImageClick(outfit.imageUrl, outfit.name)}
          data-testid={`img-container-${outfit.id}`}
        >
          <img
            src={outfit.imageUrl}
            alt={outfit.name}
            className="w-full object-contain max-h-[500px]"
            data-testid={`img-outfit-${outfit.id}`}
          />
          {outfit.occasion && (
            <span
              className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                color: "#e2d9f3",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              data-testid={`badge-occasion-${outfit.id}`}
            >
              {outfit.occasion}
            </span>
          )}
          <span
            className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
            style={{
              background: "rgba(124,58,237,0.55)",
              backdropFilter: "blur(6px)",
              color: "#e2d9f3",
              border: "1px solid rgba(168,85,247,0.35)",
            }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI Exclusive
          </span>
        </div>
      ) : (
        <div
          className="w-full h-48 flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-gray-600 text-sm">Generating image...</p>
        </div>
      )}

      {/* Expandable details: Backup + Avoid */}
      {hasDetails && showDetails && (
        <div
          className="mx-4 mt-3 rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {outfit.backupRecommendation && (
            <div className="px-4 py-3" style={{ borderBottom: outfit.avoidRecommendation ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <p className="text-xs font-semibold text-purple-400/70 uppercase tracking-wider mb-1">Backup direction</p>
              <p className="text-sm text-gray-300 leading-relaxed">{outfit.backupRecommendation}</p>
            </div>
          )}
          {outfit.avoidRecommendation && (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-1">Avoid</p>
              <p className="text-sm text-gray-300 leading-relaxed">{outfit.avoidRecommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Why this works */}
      {showWhy && outfit.whyRecommendation && (
        <div
          className="mx-4 mt-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          <p className="text-sm text-purple-200/80 italic leading-relaxed">{outfit.whyRecommendation}</p>
        </div>
      )}

      {/* Action row */}
      <div className="px-4 py-4 flex items-center gap-2">
        {/* Save / Heart */}
        <button
          onClick={() => onFavorite(outfit.id)}
          disabled={isFavoritePending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all"
          style={{
            background: outfit.isFavorite ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${outfit.isFavorite ? "rgba(236,72,153,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: outfit.isFavorite ? "#f9a8d4" : "#9ca3af",
          }}
          data-testid={`button-favorite-${outfit.id}`}
        >
          <Heart className={`w-3.5 h-3.5 ${outfit.isFavorite ? "fill-pink-400 text-pink-400" : ""}`} />
          {outfit.isFavorite ? "Saved" : "Save"}
        </button>

        {/* Why this works */}
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all"
          style={{
            background: showWhy ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${showWhy ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: showWhy ? "#c4b5fd" : "#9ca3af",
          }}
        >
          <Info className="w-3.5 h-3.5" />
          Why this works
        </button>

        {/* Details (backup + avoid) */}
        {hasDetails && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all ml-auto"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af",
            }}
          >
            Details
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onTryOn(outfit.id)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#c4b5fd",
          }}
          data-testid={`button-tryon-${outfit.id}`}
        >
          <Camera className="w-4 h-4" />
          Try It On
        </button>
        {outfit.imageUrl && (
          <button
            onClick={() => onShop(outfit.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(168,85,247,0.5))",
              border: "1px solid rgba(168,85,247,0.3)",
            }}
            data-testid={`button-shop-${outfit.id}`}
          >
            <ShoppingBag className="w-4 h-4" />
            Shop
          </button>
        )}
      </div>
    </div>
  );
}
