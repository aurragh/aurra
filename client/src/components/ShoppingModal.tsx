import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, ShoppingBag, ExternalLink, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ShoppingItem {
  name: string;
  description: string;
  category: string;
  shoppingLinks: {
    store: string;
    url: string;
  }[];
}

interface ShoppingModalProps {
  outfitId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="h-4 w-1/3 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="h-3 w-2/3 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-8 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

export function ShoppingModal({ outfitId, open, onOpenChange }: ShoppingModalProps) {
  const { data: shoppingData, isLoading } = useQuery<{ items: ShoppingItem[] }>({
    queryKey: ["/api/outfits", outfitId, "shopping"],
    queryFn: async () => {
      const response = await apiRequest("POST", `/api/outfits/${outfitId}/shopping`);
      return response.json();
    },
    enabled: open && !!outfitId,
  });

  const trackClickMutation = useMutation({
    mutationFn: async (data: { outfitId: string; itemName: string; searchQuery: string }) => {
      return apiRequest("POST", "/api/analytics/shopping-click", data);
    },
  });

  const handleShopClick = (item: ShoppingItem, url: string) => {
    trackClickMutation.mutate({
      outfitId,
      itemName: item.name,
      searchQuery: item.category + " " + item.name,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full border-0 p-0 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1A1825, #0F0E14)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: "20px",
          maxHeight: "85vh",
        }}
        data-testid="dialog-shopping-modal"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white font-semibold text-sm leading-tight">
                Shop This Look
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs">
                Find each piece online
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: "calc(85vh - 72px)" }}>
          {/* Loading */}
          {isLoading && (
            <div className="space-y-3" data-testid="loading-shopping-items">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty */}
          {!isLoading && shoppingData?.items && shoppingData.items.length === 0 && (
            <div className="text-center py-12" data-testid="text-no-shopping-items">
              <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No items could be identified from this look.</p>
            </div>
          )}

          {/* Items */}
          {!isLoading && shoppingData?.items && shoppingData.items.length > 0 && (
            <div className="space-y-3" data-testid="container-shopping-items">
              {shoppingData.items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  data-testid={`card-shopping-item-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p
                      className="text-white text-sm font-semibold leading-snug"
                      data-testid={`text-item-name-${index}`}
                    >
                      {item.name}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        color: "#c4b5fd",
                      }}
                      data-testid={`text-item-category-${index}`}
                    >
                      {item.category}
                    </span>
                  </div>

                  {item.description && (
                    <p
                      className="text-gray-500 text-xs leading-relaxed mb-3"
                      data-testid={`text-item-description-${index}`}
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {item.shoppingLinks.map((link, linkIndex) => (
                      <button
                        key={linkIndex}
                        onClick={() => handleShopClick(item, link.url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: "rgba(139,92,246,0.2)",
                          border: "1px solid rgba(139,92,246,0.35)",
                          color: "#c4b5fd",
                        }}
                        data-testid={`button-shop-${index}-${linkIndex}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.store}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
