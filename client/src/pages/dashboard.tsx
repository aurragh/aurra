import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { 
  Sparkles, 
  Heart, 
  Trash2, 
  Plus, 
  Star, 
  Award, 
  TrendingUp,
  ShoppingBag,
  ArrowLeft
} from "lucide-react";
import { type Outfit, type StyleCollection, type UserPoints } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [generatingOutfits, setGeneratingOutfits] = useState(false);

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

  const generateOutfitsMutation = useMutation({
    mutationFn: async (data: { occasion: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/generate-outfits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Outfits Generated!",
        description: "Check out your new AI-styled looks.",
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
        description: "Failed to generate outfits. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (outfitId: string) => {
      const response = await apiRequest("PATCH", `/api/outfits/${outfitId}/favorite`, {});
      return response.json();
    },
    onSuccess: () => {
      refetchOutfits();
      toast({
        title: "Favorite Updated",
        description: "Outfit favorite status updated.",
      });
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
        description: "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleGenerateOutfits = () => {
    if (!selectedOccasion) {
      toast({
        title: "Select Occasion",
        description: "Please select an occasion to generate outfits for.",
        variant: "destructive",
      });
      return;
    }

    generateOutfitsMutation.mutate({ occasion: selectedOccasion, count: 3 });
  };

  const favoriteOutfits = outfits.filter((outfit) => outfit.isFavorite);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-dashboard">
                Style Dashboard
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Header */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-level">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Style Level</p>
                  <p className="text-2xl font-bold text-white">{userPoints?.level || 'Beginner'}</p>
                  <p className="text-purple-200 text-sm">{userPoints?.points || 0} points</p>
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

        {/* AI Outfit Generator */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-outfit-generator">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
              AI Outfit Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="occasion" className="text-gray-300">Select Occasion</Label>
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-occasion">
                    <SelectValue placeholder="Choose an occasion..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work/Professional</SelectItem>
                    <SelectItem value="casual">Casual Daily Wear</SelectItem>
                    <SelectItem value="date-night">Date Night</SelectItem>
                    <SelectItem value="social-events">Social Events</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="formal">Formal Events</SelectItem>
                    <SelectItem value="weekend">Weekend Outings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerateOutfits}
                disabled={generateOutfitsMutation.isPending || !selectedOccasion}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                data-testid="button-generate-outfits"
              >
                {generateOutfitsMutation.isPending ? (
                  "Generating..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outfits
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="outfits" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20" data-testid="tabs-dashboard">
            <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
              My Outfits
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
              Favorites
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-purple-600">
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outfits" data-testid="tab-content-outfits">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-outfits">
                  <CardContent className="p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Outfits Yet</h3>
                    <p className="text-gray-300 mb-6">Generate your first AI-styled outfit to get started!</p>
                    <Link href="/quiz">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                        Complete Style Quiz
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                outfits.map((outfit: any) => (
                  <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-outfit-${outfit.id}`}>
                    <CardContent className="p-0">
                      {outfit.imageUrl && (
                        <div className="relative w-full h-48 mb-4">
                          <img 
                            src={outfit.imageUrl} 
                            alt={outfit.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            data-testid={`img-outfit-${outfit.id}`}
                          />
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavoriteMutation.mutate(outfit.id)}
                            className="text-white hover:bg-white/10"
                            data-testid={`button-favorite-${outfit.id}`}
                          >
                            <Heart 
                              className={`w-5 h-5 ${outfit.isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} 
                            />
                          </Button>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-medium">Items:</p>
                          {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-xs text-gray-300" data-testid={`item-${outfit.id}-${index}`}>
                              <span className="font-medium">{item.category}:</span> {item.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" data-testid="tab-content-favorites">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteOutfits.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-favorites">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Favorites Yet</h3>
                    <p className="text-gray-300">Heart your favorite outfits to see them here!</p>
                  </CardContent>
                </Card>
              ) : (
                favoriteOutfits.map((outfit: any) => (
                  <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20 border-red-400/30" data-testid={`card-favorite-${outfit.id}`}>
                    <CardContent className="p-0">
                      {outfit.imageUrl && (
                        <div className="relative w-full h-48 mb-4">
                          <img 
                            src={outfit.imageUrl} 
                            alt={outfit.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            data-testid={`img-favorite-${outfit.id}`}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                            <Badge 
                              variant="secondary" 
                              className="bg-purple-600/20 text-purple-200"
                              data-testid={`badge-favorite-occasion-${outfit.id}`}
                            >
                              {outfit.occasion}
                            </Badge>
                          </div>
                          <Heart className="w-5 h-5 fill-red-400 text-red-400" />
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-medium">Items:</p>
                          {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-xs text-gray-300" data-testid={`favorite-item-${outfit.id}-${index}`}>
                              <span className="font-medium">{item.category}:</span> {item.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="collections" data-testid="tab-content-collections">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-collections">
                  <CardContent className="p-12 text-center">
                    <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Collections Yet</h3>
                    <p className="text-gray-300 mb-6">Create collections to organize your favorite outfit combinations!</p>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      data-testid="button-create-collection"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Collection
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                collections.map((collection: any) => (
                  <Card key={collection.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-collection-${collection.id}`}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                      <p className="text-gray-300 text-sm mb-4">{collection.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 text-sm">
                          {JSON.parse(collection.outfitIds || '[]').length} outfits
                        </span>
                        {collection.nftMinted && (
                          <Badge variant="secondary" className="bg-green-600/20 text-green-200">
                            NFT Minted
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
