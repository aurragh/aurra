import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Sparkles, 
  Heart, 
  Star, 
  Award, 
  ShoppingBag,
  RefreshCw,
  Trash2,
  Menu,
  Home,
  LogOut,
  User,
  Plus,
  X,
  ZoomIn
} from "lucide-react";
import { type Outfit, type StyleCollection, type UserPoints, type StyleProfile } from "@shared/schema";
import { ShoppingModal } from "@/components/ShoppingModal";
import { PointsRedemption } from "@/components/PointsRedemption";
import { OutfitCard } from "@/components/OutfitCard";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [shoppingModalOutfitId, setShoppingModalOutfitId] = useState<string | null>(null);

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
      return;
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

  const generateOutfitsMutation = useMutation({
    mutationFn: async (data: { occasion: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/generate-outfits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Outfit Generated!",
        description: "Your new outfit is ready!",
      });
      refetchOutfits();
      queryClient.invalidateQueries({ queryKey: ["/api/user/points"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to generate outfit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/outfits/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Outfit Deleted",
        description: "Outfit moved to trash. You can restore it within 30 days.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete outfit",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/outfits/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Favorite Updated",
        description: "Outfit favorite status changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

  const favoriteOutfits = outfits.filter((outfit) => outfit.isFavorite);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-black">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check if user hasn't completed their profile
  const needsProfile = !styleProfile || !styleProfile.completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white" data-testid="heading-dashboard">
                Aurra
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-menu">
                    <Menu className="w-5 h-5 mr-2" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 text-white border-gray-700">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <Link href="/landing">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-landing">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Back to Landing</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/quiz">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-quiz">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      <span>Edit Style Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/trash">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-trash">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>View Trash</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/upgrade">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer text-yellow-400" data-testid="menu-item-upgrade">
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="hover:bg-gray-800 cursor-pointer text-red-400"
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2" data-testid="heading-welcome">
            Decision History
          </h2>
          <p className="text-gray-300">
            {user?.email && `Authenticated as ${user.email}`}
          </p>
        </div>

        {/* If no profile, show CTA to complete quiz */}
        {needsProfile ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-complete-profile">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl">
                Ready to decide?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Start the decision process to get grounded recommendations for your next room.
              </p>
              <Link href="/quiz">
                <Button 
                  size="lg"
                  className="bg-white text-purple-900 hover:bg-white/90"
                  data-testid="button-style-quiz"
                >
                  Start Decision Process
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-level">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Style Level</p>
                      <p className="text-2xl font-bold text-white">{userPoints?.level || 'Beginner'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-purple-200 text-sm">{userPoints?.points || 0} points</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">Total: {userPoints?.totalEarned || 0}</span>
                      </div>
                    </div>
                    <Award className="w-10 h-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-outfits">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Total Outfits</p>
                      <p className="text-2xl font-bold text-white">{outfits.length}</p>
                      <p className="text-purple-200 text-sm">{favoriteOutfits.length} favorites</p>
                    </div>
                    <ShoppingBag className="w-10 h-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-collections">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Collections</p>
                      <p className="text-2xl font-bold text-white">{collections.length}</p>
                      <p className="text-purple-200 text-sm">Style sets</p>
                    </div>
                    <Star className="w-10 h-10 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate More Outfits Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-generate-more">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-purple-400" />
                  New Decision Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">What are you choosing for right now?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: 'meeting', label: 'High-Stakes Meeting', icon: '⚖️' },
                    { value: 'speaking', label: 'Public Speaking', icon: '🎤' },
                    { value: 'leadership', label: 'Daily Leadership', icon: '🏛️' },
                    { value: 'travel', label: 'Visibility Travel', icon: '🌐' }
                  ].map((occasion) => (
                    <Card 
                      key={occasion.value}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-white/5 border-white/10 hover:border-purple-400 ${generateOutfitsMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => {
                        if (!generateOutfitsMutation.isPending) {
                          generateOutfitsMutation.mutate({ occasion: occasion.label, count: 1 });
                        }
                      }}
                      data-testid={`generate-more-${occasion.value}`}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{occasion.icon}</div>
                        <p className="text-white text-sm font-medium">{occasion.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {generateOutfitsMutation.isPending && (
                  <div className="text-center mt-6">
                    <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent mx-auto mb-2" />
                    <p className="text-purple-200 text-sm">Processing decision...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outfits Section */}
            {outfits.length > 0 ? (
              <Tabs defaultValue="outfits" className="space-y-6">
                <TabsList className="bg-white/10 border-white/20" data-testid="tabs-dashboard">
                  <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
                    All Decisions
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
                    Saved Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="data-[state=active]:bg-purple-600">
                    Rewards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="outfits" data-testid="tab-content-outfits">
                  <div className="space-y-8">
                    {outfits.map((outfit: any) => (
                      <OutfitCard
                        key={outfit.id}
                        outfit={outfit}
                        onFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        onDelete={(id) => deleteOutfitMutation.mutate(id)}
                        onShop={(id) => setShoppingModalOutfitId(id)}
                        onImageClick={(url, name) => setLightboxImage({ url, name })}
                        onGenerateAnother={(occasion) => generateOutfitsMutation.mutate({ occasion, count: 1 })}
                        isFavoritePending={toggleFavoriteMutation.isPending}
                        isDeletePending={deleteOutfitMutation.isPending}
                        isGenerating={generateOutfitsMutation.isPending}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="favorites" data-testid="tab-content-favorites">
                  {favoriteOutfits.length > 0 ? (
                    <div className="space-y-8">
                      {favoriteOutfits.map((outfit: any) => (
                        <OutfitCard
                          key={outfit.id}
                          outfit={outfit}
                          onFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                          onDelete={(id) => deleteOutfitMutation.mutate(id)}
                          onShop={(id) => setShoppingModalOutfitId(id)}
                          onImageClick={(url, name) => setLightboxImage({ url, name })}
                          onGenerateAnother={(occasion) => generateOutfitsMutation.mutate({ occasion, count: 1 })}
                          isFavoritePending={toggleFavoriteMutation.isPending}
                          isDeletePending={deleteOutfitMutation.isPending}
                          isGenerating={generateOutfitsMutation.isPending}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No saved recommendations yet</p>
                      <p className="text-gray-400 text-sm mt-2">Save your favorite looks to see them here!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rewards" data-testid="tab-content-rewards">
                  <div className="max-w-md mx-auto">
                    <PointsRedemption />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">No outfits generated yet</p>
                    <p className="text-gray-400 text-sm">Click on an occasion above to generate your first personalized outfit!</p>
                  </CardContent>
                </Card>
                <PointsRedemption />
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl w-full bg-black/95 border-white/20 p-0" data-testid="dialog-lightbox">
          <DialogTitle className="sr-only">{lightboxImage?.name || 'Outfit Image'}</DialogTitle>
          <DialogDescription className="sr-only">Zoomed view of outfit image</DialogDescription>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setLightboxImage(null)}
              data-testid="button-close-lightbox"
            >
              <X className="w-6 h-6" />
            </Button>
            {lightboxImage && (
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.name}
                className="w-full h-auto max-h-[85vh] object-contain"
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
    </div>
  );
}