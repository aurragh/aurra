import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ChevronDown, ChevronUp, RefreshCw, Bookmark, X, Info } from "lucide-react";

interface OutfitCardProps {
  outfit: any;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onShop: (id: string) => void;
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
  onImageClick,
  onGenerateAnother,
  isFavoritePending,
  isDeletePending,
  isGenerating,
}: OutfitCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="max-w-lg mx-auto w-full" data-testid={`card-outfit-${outfit.id}`}>
      <div className="bg-[#f5f0eb] rounded-2xl overflow-hidden shadow-xl">
        {outfit.primaryRecommendation && (
          <div className="px-6 pt-6 pb-3">
            <p className="text-[#3d3530] text-lg font-serif italic leading-relaxed">
              {outfit.primaryRecommendation}
            </p>
          </div>
        )}

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
            <Badge
              className="absolute top-3 right-3 bg-black/50 text-white text-xs backdrop-blur-sm border-0"
              data-testid={`badge-occasion-${outfit.id}`}
            >
              {outfit.occasion}
            </Badge>
          </div>
        ) : (
          <div className="w-full h-48 bg-[#e8e0d8] flex items-center justify-center">
            <p className="text-[#8a7e74] text-sm">Generating image...</p>
          </div>
        )}

        {outfit.backupRecommendation && showDetails && (
          <div className="px-6 py-3 bg-[#ebe5de] border-t border-[#ddd5cc]">
            <p className="text-xs font-semibold text-[#6b5f54] uppercase tracking-wider mb-1">Backup direction</p>
            <p className="text-sm text-[#4a3f35]">{outfit.backupRecommendation}</p>
          </div>
        )}

        {outfit.avoidRecommendation && showDetails && (
          <div className="px-6 py-3 bg-[#f0e8e2] border-t border-[#ddd5cc]">
            <p className="text-xs font-semibold text-[#a05a3c] uppercase tracking-wider mb-1">Avoid</p>
            <p className="text-sm text-[#6b4430]">{outfit.avoidRecommendation}</p>
          </div>
        )}

        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 bg-[#e8e0d8] hover:bg-[#ddd5cc] text-[#3d3530] rounded-full text-sm font-medium h-9"
              onClick={() => onGenerateAnother?.(outfit.occasion || "casual")}
              disabled={isGenerating}
              data-testid={`button-another-${outfit.id}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              Show another direction
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`bg-[#e8e0d8] hover:bg-[#ddd5cc] rounded-full h-9 px-3 ${outfit.isFavorite ? "bg-[#d4c4b4]" : ""}`}
              onClick={() => onFavorite(outfit.id)}
              disabled={isFavoritePending}
              data-testid={`button-favorite-${outfit.id}`}
            >
              <Bookmark className={`w-4 h-4 mr-1 ${outfit.isFavorite ? "fill-[#3d3530] text-[#3d3530]" : "text-[#6b5f54]"}`} />
              <span className="text-xs text-[#6b5f54]">{outfit.isFavorite ? "Saved" : "Save"}</span>
            </Button>
          </div>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm h-9 font-medium"
                onClick={() => { onDelete(outfit.id); setConfirmDelete(false); }}
                disabled={isDeletePending}
                data-testid={`button-delete-${outfit.id}`}
              >
                Remove this look
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-[#e8e0d8] text-[#6b5f54] rounded-full text-sm h-9"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-transparent hover:bg-[#e8e0d8] text-[#6b5f54] rounded-full text-sm h-9"
              onClick={() => setConfirmDelete(true)}
              data-testid={`button-not-for-today-${outfit.id}`}
            >
              <X className="w-4 h-4 mr-2" />
              Not for today
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 bg-transparent hover:bg-[#e8e0d8] text-[#6b5f54] rounded-full text-sm h-9"
              onClick={() => setShowWhy(!showWhy)}
            >
              <Info className="w-4 h-4 mr-2" />
              Why this works
              {showWhy ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            {(outfit.backupRecommendation || outfit.avoidRecommendation) && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-[#e8e0d8] text-[#6b5f54] rounded-full text-sm h-9"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Less" : "More"}
                {showDetails ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            )}
          </div>

          {showWhy && outfit.whyRecommendation && (
            <div className="px-3 py-3 bg-[#ebe5de] rounded-xl">
              <p className="text-sm text-[#4a3f35] italic">{outfit.whyRecommendation}</p>
            </div>
          )}

          {outfit.imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-[#3d3530] hover:bg-[#2a231f] text-[#f5f0eb] rounded-full text-sm h-10 font-medium"
              onClick={() => onShop(outfit.id)}
              data-testid={`button-shop-${outfit.id}`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop This Look
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
