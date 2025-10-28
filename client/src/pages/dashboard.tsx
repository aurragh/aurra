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

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-dashboard">
                Aurra AI
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
            Welcome to Your Style Dashboard
          </h2>
          <p className="text-gray-300">
            {user?.email && `Logged in as ${user.email}`}
          </p>
        </div>

        {/* If no profile, show CTA to complete quiz */}
        {needsProfile ? (
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-purple-400/30 mb-8" data-testid="card-complete-profile">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 mr-3 text-purple-400" />
                Create Your Style Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Complete our quick style quiz to get personalized outfit recommendations tailored just for you!
              </p>
              <Link href="/quiz">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="button-style-quiz"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Style Quiz
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
                  <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                  Generate New Outfits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">Choose an occasion to generate a personalized outfit</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: 'work', label: 'Work', icon: '💼' },
                    { value: 'casual', label: 'Casual', icon: '👕' },
                    { value: 'date-night', label: 'Date Night', icon: '💕' },
                    { value: 'social-events', label: 'Social', icon: '🎉' },
                    { value: 'travel', label: 'Travel', icon: '✈️' },
                    { value: 'formal', label: 'Formal', icon: '🤵' },
                    { value: 'weekend', label: 'Weekend', icon: '🌞' },
                    { value: 'workout', label: 'Workout', icon: '💪' },
                  ].map((occasion) => (
                    <Card 
                      key={occasion.value}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-white/5 border-white/20 hover:border-purple-400 ${generateOutfitsMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => {
                        if (!generateOutfitsMutation.isPending) {
                          generateOutfitsMutation.mutate({ occasion: occasion.value, count: 1 });
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
                    <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-purple-200 text-sm">Generating your personalized outfit...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outfits Section */}
            {outfits.length > 0 ? (
              <Tabs defaultValue="outfits" className="space-y-6">
                <TabsList className="bg-white/10 border-white/20" data-testid="tabs-dashboard">
                  <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
                    All Outfits
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
                    Favorites
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="outfits" data-testid="tab-content-outfits">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {outfits.map((outfit: any) => (
                      <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-outfit-${outfit.id}`}>
                        <CardContent className="p-0">
                          {outfit.imageUrl && (
                            <div 
                              className="relative w-full h-48 mb-4 cursor-pointer group"
                              onClick={() => setLightboxImage({ url: outfit.imageUrl, name: outfit.name })}
                              data-testid={`img-container-${outfit.id}`}
                            >
                              <img 
                                src={outfit.imageUrl} 
                                alt={outfit.name}
                                className="w-full h-full object-cover rounded-t-lg"
                                data-testid={`img-outfit-${outfit.id}`}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center rounded-t-lg">
                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                                <Badge 
                                  variant="secondary" 
                                  className="bg-purple-600/20 text-purple-200"
                                  data-testid={`badge-occasion-${outfit.id}`}
                                >
                                  {outfit.occasion}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/10"
                                  onClick={() => toggleFavoriteMutation.mutate(outfit.id)}
                                  disabled={toggleFavoriteMutation.isPending}
                                  data-testid={`button-favorite-${outfit.id}`}
                                >
                                  <Heart 
                                    className={`w-4 h-4 ${outfit.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/10"
                                  onClick={() => deleteOutfitMutation.mutate(outfit.id)}
                                  disabled={deleteOutfitMutation.isPending}
                                  data-testid={`button-delete-${outfit.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{outfit.description}</p>
                            
                            <div className="space-y-2">
                              <p className="text-gray-400 text-xs font-medium">Items:</p>
                              {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                                <div key={index} className="text-xs text-gray-300">
                                  <span className="font-medium">{item.category}:</span> {item.description}
                                </div>
                              ))}
                            </div>
                            
                            {outfit.shoppingLinks && JSON.parse(outfit.shoppingLinks).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full border-purple-400/30 text-purple-200 hover:bg-purple-600/20"
                                  onClick={() => window.open(JSON.parse(outfit.shoppingLinks)[0].url, '_blank')}
                                  data-testid={`button-shop-${outfit.id}`}
                                >
                                  <ShoppingBag className="w-4 h-4 mr-2" />
                                  Shop This Look
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="favorites" data-testid="tab-content-favorites">
                  {favoriteOutfits.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteOutfits.map((outfit: any) => (
                        <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-favorite-${outfit.id}`}>
                          <CardContent className="p-0">
                            {outfit.imageUrl && (
                              <div 
                                className="relative w-full h-48 mb-4 cursor-pointer group"
                                onClick={() => setLightboxImage({ url: outfit.imageUrl, name: outfit.name })}
                              >
                                <img 
                                  src={outfit.imageUrl} 
                                  alt={outfit.name}
                                  className="w-full h-full object-cover rounded-t-lg"
                                />
                                <Badge className="absolute top-2 right-2 bg-red-600 text-white pointer-events-none">
                                  <Heart className="w-3 h-3 mr-1" />
                                  Favorite
                                </Badge>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center rounded-t-lg">
                                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )}
                            <div className="p-6">
                              <h3 className="text-lg font-semibold text-white mb-2">{outfit.name}</h3>
                              <Badge 
                                variant="secondary" 
                                className="bg-purple-600/20 text-purple-200 mb-4"
                              >
                                {outfit.occasion}
                              </Badge>
                              <p className="text-gray-300 text-sm line-clamp-2">{outfit.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No favorite outfits yet</p>
                      <p className="text-gray-400 text-sm mt-2">Heart your favorite looks to see them here!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">No outfits generated yet</p>
                  <p className="text-gray-400 text-sm">Click on an occasion above to generate your first personalized outfit!</p>
                </CardContent>
              </Card>
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
    </div>
  );
}