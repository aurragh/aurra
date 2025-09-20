import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sparkles, ShoppingBag, Star, TrendingUp, Award, Users } from "lucide-react";
import { type StyleProfile, type UserPoints, type Outfit } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: styleProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  const { data: userPoints } = useQuery<UserPoints>({
    queryKey: ["/api/user/points"],
    enabled: !!user,
  });

  const { data: recentOutfits } = useQuery<Outfit[]>({
    queryKey: ["/api/outfits"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const needsStyleProfile = !styleProfile || !styleProfile.completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-brand">
              Aurra
            </h1>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-dashboard">
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="heading-welcome">
            Welcome back, {user?.firstName || 'Stylist'}!
          </h1>
          <p className="text-xl text-gray-300 mb-8" data-testid="text-welcome-subtitle">
            Ready to discover your perfect style today?
          </p>

          {needsStyleProfile && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto mb-8" data-testid="card-style-profile-prompt">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
                  <h3 className="text-2xl font-semibold text-white">Complete Your Style Profile</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Take our AI-powered style quiz to get personalized outfit recommendations tailored just for you.
                </p>
                <Link href="/dashboard?quiz=true">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    data-testid="button-start-quiz"
                  >
                    Start Style Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-points">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Style Points</p>
                  <p className="text-3xl font-bold text-white">{userPoints?.points || 0}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-600/20 text-purple-200"
                      data-testid="badge-level"
                    >
                      {userPoints?.level || 'Beginner'}
                    </Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">Earned: {userPoints?.totalEarned || 0}</span>
                  </div>
                </div>
                <Award className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-outfits">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Saved Outfits</p>
                  <p className="text-3xl font-bold text-white">{recentOutfits?.length || 0}</p>
                  <p className="text-purple-200 text-sm mt-2">Personal collection</p>
                </div>
                <ShoppingBag className="w-12 h-12 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-subscription">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Plan Status</p>
                  <p className="text-2xl font-bold text-white capitalize">{user?.subscriptionStatus || 'Free'}</p>
                  <p className="text-purple-200 text-sm mt-2">
                    {user?.subscriptionStatus === 'free' ? 'Limited features' : 'All features unlocked'}
                  </p>
                </div>
                <Star className={`w-12 h-12 ${user?.subscriptionStatus === 'free' ? 'text-gray-400' : 'text-yellow-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Link href="/dashboard">
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-purple-400/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-all cursor-pointer group" data-testid="card-action-generate">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-semibold text-white mb-3">Generate Outfits</h3>
                <p className="text-gray-300">
                  {needsStyleProfile ? "Complete style quiz and get AI-powered outfit recommendations" : "Get new AI-powered outfit recommendations"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {user?.subscriptionStatus === 'free' && (
            <Link href="/subscribe">
              <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-sm border-yellow-400/30 hover:from-yellow-600/30 hover:to-orange-600/30 transition-all cursor-pointer group" data-testid="card-action-premium">
                <CardContent className="p-8 text-center">
                  <Star className="w-16 h-16 text-yellow-400 mx-auto mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-semibold text-white mb-3">Upgrade to Premium</h3>
                  <p className="text-gray-300">
                    Unlimited outfit generation, advanced styling features, and priority support
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Recent Activity */}
        {recentOutfits && recentOutfits.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-recent-outfits">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2" />
                Recent Outfits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {recentOutfits.slice(0, 3).map((outfit) => (
                  <Card key={outfit.id} className="bg-white/5 border-white/10" data-testid={`card-recent-outfit-${outfit.id}`}>
                    <CardContent className="p-4">
                      <h4 className="text-white font-medium mb-2">{outfit.name}</h4>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{outfit.description}</p>
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-600/20 text-purple-200"
                        data-testid={`badge-occasion-${outfit.id}`}
                      >
                        {outfit.occasion}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
