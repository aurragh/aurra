import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import {
  Heart,
  Sparkles,
  Trash2,
  Menu,
  Home,
  LogOut,
  Plus,
  X,
  MessageCircle,
  Shirt,
  RefreshCw,
  Send,
} from "lucide-react";
import { type Outfit, type StyleCollection, type UserPoints, type StyleProfile } from "@shared/schema";
import { ShoppingModal } from "@/components/ShoppingModal";
import { PointsRedemption } from "@/components/PointsRedemption";
import { OutfitCard } from "@/components/OutfitCard";
import { StyleDNACard } from "@/components/StyleDNACard";
import { TryOnModal } from "@/components/TryOnModal";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [shoppingModalOutfitId, setShoppingModalOutfitId] = useState<string | null>(null);
  const [tryOnOutfitId, setTryOnOutfitId] = useState<string | null>(null);
  const [highlightNewOutfit, setHighlightNewOutfit] = useState(false);
  const [occasionInput, setOccasionInput] = useState("");
  const firstOutfitRef = useRef<HTMLDivElement>(null);

  // Detect ?new=1 param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setHighlightNewOutfit(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: outfits = [], refetch: refetchOutfits } = useQuery<Outfit[]>({
    queryKey: ["/api/outfits"],
    enabled: !!user,
  });

  const { data: collections = [] } = useQuery<StyleCollection[]>({
    queryKey: ["/api/collections"],
    enabled: !!user,
  });

  const { data: userPoints } = useQuery<UserPoints>({
    queryKey: ["/api/user/points"],
    enabled: !!user,
  });

  const { data: styleProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  // Scroll and highlight first outfit when ?new=1
  useEffect(() => {
    if (highlightNewOutfit && outfits.length > 0 && firstOutfitRef.current) {
      setTimeout(() => {
        firstOutfitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      const t = setTimeout(() => setHighlightNewOutfit(false), 3000);
      return () => clearTimeout(t);
    }
  }, [highlightNewOutfit, outfits]);

  const generateOutfitsMutation = useMutation({
    mutationFn: async (data: { occasion: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/generate-outfits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "New look ready!" });
      setOccasionInput("");
      refetchOutfits();
      queryClient.invalidateQueries({ queryKey: ["/api/user/points"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate look. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/outfits/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Look removed", description: "You can restore it from Trash within 30 days." });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) { window.location.href = "/api/login"; return; }
      toast({ title: "Error", description: "Failed to remove look", variant: "destructive" });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/outfits/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) { window.location.href = "/api/login"; return; }
    },
  });

  const handleGenerate = () => {
    const occasion = occasionInput.trim() || "general";
    generateOutfitsMutation.mutate({ occasion, count: 1 });
  };

  const favoriteOutfits = outfits.filter((o) => o.isFavorite);
  const needsProfile = !styleProfile || !styleProfile.completed;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0812" }}>
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #0d0812 0%, #130d1a 50%, #0d0812 100%)" }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-30"
        style={{
          background: "rgba(13,8,18,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1
            className="text-xl font-bold text-white tracking-tight"
            data-testid="heading-dashboard"
          >
            Aurra
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                data-testid="button-menu"
              >
                <Menu className="w-4 h-4" />
                Menu
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-52 border-gray-800"
              style={{ background: "#130d1a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <DropdownMenuLabel className="text-gray-500 text-xs">Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <Link href="/landing">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" data-testid="menu-item-landing">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Landing
                </DropdownMenuItem>
              </Link>
              <Link href="/quiz">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" data-testid="menu-item-quiz">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Edit Style Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/chat">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" data-testid="menu-item-chat">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat with NOVA
                </DropdownMenuItem>
              </Link>
              <Link href="/wardrobe">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" data-testid="menu-item-wardrobe">
                  <Shirt className="mr-2 h-4 w-4" />
                  My Wardrobe
                </DropdownMenuItem>
              </Link>
              <Link href="/trash">
                <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer" data-testid="menu-item-trash">
                  <Trash2 className="mr-2 h-4 w-4" />
                  View Trash
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/api/logout")}
                className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                data-testid="menu-item-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* No profile CTA */}
        {needsProfile ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
            data-testid="card-complete-profile"
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              N
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Build your style profile</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Answer 11 questions with NOVA to get personalized look recommendations.
            </p>
            <Link href="/quiz">
              <button
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                data-testid="button-style-quiz"
              >
                Start Style Profile
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Style DNA Card */}
            {styleProfile?.completed && <StyleDNACard profile={styleProfile} />}

            {/* Page header with count */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-semibold" data-testid="heading-welcome">
                Your Looks
              </h2>
              <p className="text-gray-600 text-xs">
                {outfits.length} {outfits.length === 1 ? "look" : "looks"} · {favoriteOutfits.length} saved
              </p>
            </div>

            {/* Generate CTA bar */}
            <div
              className="flex items-center gap-2 mb-6 p-2 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              data-testid="card-generate-more"
            >
              <input
                type="text"
                value={occasionInput}
                onChange={(e) => setOccasionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !generateOutfitsMutation.isPending && handleGenerate()}
                placeholder="Describe the moment (e.g. board meeting, evening dinner...)"
                className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none px-3 py-2"
                disabled={generateOutfitsMutation.isPending}
              />
              <button
                onClick={handleGenerate}
                disabled={generateOutfitsMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                data-testid="generate-more-meeting"
              >
                {generateOutfitsMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Look
                  </>
                )}
              </button>
            </div>

            {/* Outfits section */}
            {outfits.length > 0 ? (
              <Tabs defaultValue="outfits" className="space-y-5">
                <TabsList
                  className="w-full border-0 p-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  data-testid="tabs-dashboard"
                >
                  <TabsTrigger
                    value="outfits"
                    className="flex-1 text-xs rounded-lg data-[state=active]:text-white data-[state=active]:shadow-none text-gray-500"
                    style={{ "--tw-ring-shadow": "none" } as any}
                  >
                    All Looks
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="flex-1 text-xs rounded-lg data-[state=active]:text-white data-[state=active]:shadow-none text-gray-500"
                  >
                    Saved ({favoriteOutfits.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="rewards"
                    className="flex-1 text-xs rounded-lg data-[state=active]:text-white data-[state=active]:shadow-none text-gray-500"
                  >
                    Rewards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="outfits" data-testid="tab-content-outfits">
                  <div className="space-y-6">
                    {outfits.map((outfit: any, index: number) => (
                      <div
                        key={outfit.id}
                        ref={index === 0 ? firstOutfitRef : undefined}
                        className="transition-all duration-700"
                        style={
                          index === 0 && highlightNewOutfit
                            ? {
                                borderRadius: "16px",
                                boxShadow: "0 0 0 2px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.25)",
                              }
                            : undefined
                        }
                      >
                        <OutfitCard
                          outfit={outfit}
                          onFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                          onDelete={(id) => deleteOutfitMutation.mutate(id)}
                          onShop={(id) => setShoppingModalOutfitId(id)}
                          onTryOn={(id) => setTryOnOutfitId(id)}
                          onImageClick={(url, name) => setLightboxImage({ url, name })}
                          isFavoritePending={toggleFavoriteMutation.isPending}
                          isDeletePending={deleteOutfitMutation.isPending}
                          isGenerating={generateOutfitsMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="favorites" data-testid="tab-content-favorites">
                  {favoriteOutfits.length > 0 ? (
                    <div className="space-y-6">
                      {favoriteOutfits.map((outfit: any) => (
                        <OutfitCard
                          key={outfit.id}
                          outfit={outfit}
                          onFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                          onDelete={(id) => deleteOutfitMutation.mutate(id)}
                          onShop={(id) => setShoppingModalOutfitId(id)}
                          onTryOn={(id) => setTryOnOutfitId(id)}
                          onImageClick={(url, name) => setLightboxImage({ url, name })}
                          isFavoritePending={toggleFavoriteMutation.isPending}
                          isDeletePending={deleteOutfitMutation.isPending}
                          isGenerating={generateOutfitsMutation.isPending}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Heart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No saved looks yet</p>
                      <p className="text-gray-600 text-xs mt-1">Tap the heart on any look to save it here.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rewards" data-testid="tab-content-rewards">
                  <div className="max-w-sm mx-auto">
                    <PointsRedemption />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Sparkles className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <p className="text-gray-300 text-sm font-medium mb-1">No looks generated yet</p>
                <p className="text-gray-600 text-xs">
                  Use the box above to describe a moment and generate your first personalized look.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent
          className="max-w-3xl w-full p-0 border-0"
          style={{ background: "rgba(0,0,0,0.97)" }}
          data-testid="dialog-lightbox"
        >
          <DialogTitle className="sr-only">{lightboxImage?.name || "Outfit Image"}</DialogTitle>
          <DialogDescription className="sr-only">Zoomed view of outfit image</DialogDescription>
          <div className="relative">
            <button
              className="absolute top-3 right-3 z-10 p-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)" }}
              onClick={() => setLightboxImage(null)}
              data-testid="button-close-lightbox"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {lightboxImage && (
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="w-full h-auto max-h-[88vh] object-contain"
                data-testid="img-lightbox"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shopping Modal */}
      {shoppingModalOutfitId && (
        <ShoppingModal
          outfitId={shoppingModalOutfitId}
          open={!!shoppingModalOutfitId}
          onOpenChange={(open) => !open && setShoppingModalOutfitId(null)}
        />
      )}

      {/* Try-On Modal */}
      <TryOnModal
        outfitId={tryOnOutfitId}
        onClose={() => setTryOnOutfitId(null)}
      />

      {/* Floating NOVA Chat button */}
      <Link href="/chat">
        <button
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            boxShadow: "0 4px 24px rgba(139,92,246,0.45)",
          }}
          data-testid="button-nova-chat"
        >
          <MessageCircle className="w-4 h-4" />
          Chat with NOVA
        </button>
      </Link>
    </div>
  );
}
