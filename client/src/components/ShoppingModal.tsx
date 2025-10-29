import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingBag, ExternalLink } from "lucide-react";
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

  const handleShopClick = (item: ShoppingItem, url: string, searchQuery: string) => {
    // Track the click with the original search query
    trackClickMutation.mutate({
      outfitId,
      itemName: item.name,
      searchQuery: searchQuery, // Store the actual search query, not the URL
    });
    
    // Open the shopping link
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-shopping-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-shopping-modal-title">
            <ShoppingBag className="h-5 w-5" />
            Shop This Look
          </DialogTitle>
          <DialogDescription data-testid="text-shopping-modal-description">
            Find similar items from top online stores
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12" data-testid="loading-shopping-items">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && shoppingData?.items && shoppingData.items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-shopping-items">
            No items could be extracted from this outfit image.
          </div>
        )}

        {!isLoading && shoppingData?.items && shoppingData.items.length > 0 && (
          <div className="space-y-4" data-testid="container-shopping-items">
            {shoppingData.items.map((item, index) => (
              <Card key={index} data-testid={`card-shopping-item-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg" data-testid={`text-item-name-${index}`}>
                    {item.name}
                  </CardTitle>
                  <CardDescription data-testid={`text-item-category-${index}`}>
                    {item.category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-item-description-${index}`}>
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.shoppingLinks.map((link, linkIndex) => (
                      <Button
                        key={linkIndex}
                        variant="outline"
                        size="sm"
                        onClick={() => handleShopClick(item, link.url, item.category + ' ' + item.name)}
                        className="gap-2"
                        data-testid={`button-shop-${index}-${linkIndex}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Shop on {link.store}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
