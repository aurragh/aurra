import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp,
  DollarSign,
  Star,
  Activity,
  ArrowLeft,
  Eye,
  Trash2
} from "lucide-react";
import { type User, type Outfit } from "@shared/schema";
import { RotatingBackground } from "@/components/RotatingBackground";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated or not admin
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
    
    // For now, only allow specific admin email - this should be configurable
    if (!isLoading && user && user.email !== "writersure369@gmail.com") {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && user.email === "writersure369@gmail.com",
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.email === "writersure369@gmail.com",
  });

  const { data: allOutfits = [] } = useQuery<Outfit[]>({
    queryKey: ["/api/admin/outfits"],
    enabled: !!user && user.email === "writersure369@gmail.com",
  });

  if (isLoading) {
    return (
      <RotatingBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </RotatingBackground>
    );
  }

  if (!user || user.email !== "writersure369@gmail.com") {
    return null;
  }

  return (
    <RotatingBackground>
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-admin-dashboard">
                Admin Dashboard
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{allUsers.length}</p>
                  <p className="text-purple-200 text-sm">Registered accounts</p>
                </div>
                <Users className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-outfits">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Outfits</p>
                  <p className="text-2xl font-bold text-white">{allOutfits.length}</p>
                  <p className="text-purple-200 text-sm">AI generated</p>
                </div>
                <ShoppingBag className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-premium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Premium Users</p>
                  <p className="text-2xl font-bold text-white">
                    {allUsers.filter(u => u.subscriptionStatus !== 'free').length}
                  </p>
                  <p className="text-purple-200 text-sm">Paying subscribers</p>
                </div>
                <Star className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Est. Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${(allUsers.filter(u => u.subscriptionStatus !== 'free').length * 9.99).toFixed(2)}
                  </p>
                  <p className="text-purple-200 text-sm">Based on $9.99/month</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20" data-testid="tabs-admin">
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
              Users
            </TabsTrigger>
            <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
              Outfits
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" data-testid="tab-content-users">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((u) => (
                    <Card key={u.id} className="bg-white/5 border-white/10" data-testid={`card-user-${u.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email ? u.email.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-medium">
                                {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                              </h4>
                              <p className="text-gray-300 text-sm">{u.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant="secondary" 
                                  className={`${
                                    u.subscriptionStatus === 'free' 
                                      ? 'bg-gray-600/20 text-gray-200' 
                                      : 'bg-purple-600/20 text-purple-200'
                                  }`}
                                  data-testid={`badge-subscription-${u.id}`}
                                >
                                  {u.subscriptionStatus || 'Free'}
                                </Badge>
                                <span className="text-gray-400 text-xs">
                                  Joined {new Date(u.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outfits" data-testid="tab-content-outfits">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingBag className="w-6 h-6 mr-2" />
                  Outfit Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allOutfits.slice(0, 12).map((outfit) => (
                    <Card key={outfit.id} className="bg-white/5 border-white/10" data-testid={`card-outfit-${outfit.id}`}>
                      <CardContent className="p-0">
                        {outfit.imageUrl && (
                          <div className="relative w-full h-32 mb-4">
                            <img 
                              src={outfit.imageUrl} 
                              alt={outfit.name}
                              className="w-full h-full object-cover rounded-t-lg"
                              data-testid={`img-outfit-${outfit.id}`}
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-medium text-sm">{outfit.name}</h4>
                              <Badge 
                                variant="secondary" 
                                className="bg-purple-600/20 text-purple-200 text-xs"
                              >
                                {outfit.occasion}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-gray-300 text-xs line-clamp-2">{outfit.description}</p>
                          <div className="mt-2 text-xs text-gray-400">
                            Created {new Date(outfit.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" data-testid="tab-content-analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-300">Analytics dashboard coming soon</p>
                    <p className="text-gray-400 text-sm mt-2">Track user engagement, outfit generation rates, and revenue trends</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-6 h-6 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Users</span>
                      <span className="text-white font-semibold">{allUsers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Premium Conversion</span>
                      <span className="text-white font-semibold">
                        {allUsers.length > 0 ? ((allUsers.filter(u => u.subscriptionStatus !== 'free').length / allUsers.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Avg Outfits per User</span>
                      <span className="text-white font-semibold">
                        {allUsers.length > 0 ? (allOutfits.length / allUsers.length).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" data-testid="tab-content-settings">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4">Stripe Configuration</h3>
                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Stripe Public Key</span>
                      <Badge variant="secondary" className={import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'bg-green-600/20 text-green-200' : 'bg-red-600/20 text-red-200'}>
                        {import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'Configured' : 'Not Set'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Stripe Secret Key</span>
                      <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-200">
                        Check Server Logs
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-4">OpenAI Configuration</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">OpenAI API Key</span>
                      <Badge variant="secondary" className="bg-green-600/20 text-green-200">
                        Configured
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RotatingBackground>
  );
}