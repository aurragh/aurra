import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Trash2,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { type Outfit } from "@shared/schema";

export default function Trash() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: deletedOutfits = [], refetch: refetchDeletedOutfits } = useQuery<Outfit[]>({
    queryKey: ["/api/outfits/trash"],
    enabled: !!user,
  });

  const restoreOutfitMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/outfits/${id}/restore`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Outfit Restored",
        description: "Outfit has been restored to your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits/trash"] });
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
        description: "Failed to restore outfit",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/outfits/${id}/permanent`);
    },
    onSuccess: () => {
      toast({
        title: "Permanently Deleted",
        description: "Outfit has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits/trash"] });
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
        description: "Failed to permanently delete outfit",
        variant: "destructive",
      });
    },
  });

  const calculateDaysLeft = (deletedAt: Date | string | null) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-black">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-trash">
                Trash
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
        {/* Info Card */}
        <Card className="bg-yellow-500/10 backdrop-blur-sm border-yellow-400/30 mb-8" data-testid="card-trash-info">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Trash Information</h3>
                <p className="text-gray-300">
                  Items in trash will be automatically deleted after 30 days. 
                  You can restore items to your collection or permanently delete them at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deleted Outfits */}
        {deletedOutfits.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-trash-empty">
            <CardContent className="p-12 text-center">
              <Trash2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Trash is Empty</h3>
              <p className="text-gray-300">No deleted outfits found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deletedOutfits.map((outfit: any) => {
              const daysLeft = calculateDaysLeft(outfit.deletedAt);
              
              return (
                <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-deleted-${outfit.id}`}>
                  <CardContent className="p-0">
                    {outfit.imageUrl && (
                      <div className="relative w-full h-48 mb-4">
                        <img 
                          src={outfit.imageUrl} 
                          alt={outfit.name}
                          className="w-full h-full object-cover rounded-t-lg opacity-75"
                          data-testid={`img-deleted-${outfit.id}`}
                        />
                        <Badge 
                          className={`absolute top-2 right-2 ${daysLeft < 7 ? 'bg-red-600' : 'bg-yellow-600'} text-white`}
                        >
                          {daysLeft} days left
                        </Badge>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className="bg-purple-600/20 text-purple-200"
                          data-testid={`badge-occasion-deleted-${outfit.id}`}
                        >
                          {outfit.occasion}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-green-400/30 text-green-400 hover:bg-green-400/10"
                          onClick={() => restoreOutfitMutation.mutate(outfit.id)}
                          disabled={restoreOutfitMutation.isPending}
                          data-testid={`button-restore-${outfit.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this outfit? This action cannot be undone.")) {
                              permanentDeleteMutation.mutate(outfit.id);
                            }
                          }}
                          disabled={permanentDeleteMutation.isPending}
                          data-testid={`button-delete-permanent-${outfit.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}