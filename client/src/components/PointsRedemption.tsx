import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Gift, Crown, Ticket, History, Loader2 } from "lucide-react";

interface PointsData {
  points: number;
  level: string;
  totalEarned: number;
  transactions: Array<{
    id: string;
    type: string;
    action: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
  activeTrial: { expiresAt: string } | null;
  activeDiscount: { code: string; discountAmount: number } | null;
  freeOutfitCredits: number;
}

const redemptionOptions = [
  {
    id: "outfit",
    name: "Free Outfit",
    cost: 50,
    description: "Generate one outfit without using your monthly limit",
    icon: Gift,
    action: "outfit",
  },
  {
    id: "premium",
    name: "24-Hour Premium",
    cost: 100,
    description: "Unlock all premium features for 24 hours",
    icon: Crown,
    action: "premium-trial",
  },
  {
    id: "discount",
    name: "$2 Off Upgrade",
    cost: 200,
    description: "Get a discount code for your next subscription upgrade",
    icon: Ticket,
    action: "discount",
  },
];

export function PointsRedemption() {
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);

  const { data: pointsData, isLoading } = useQuery<PointsData>({
    queryKey: ["/api/points"],
  });

  const redeemMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await apiRequest("POST", `/api/points/redeem/${action}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Redemption Successful",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      } else {
        toast({
          title: "Redemption Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to redeem points. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-black/40 backdrop-blur-sm border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  const points = pointsData?.points ?? 0;
  const level = pointsData?.level ?? "Beginner";

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Your Points</CardTitle>
              <CardDescription className="text-gray-400">
                Earn points and redeem for rewards
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
              {points}
            </div>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              {level}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(pointsData?.freeOutfitCredits ?? 0) > 0 && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium">
                  Free Outfit Credits
                </span>
              </div>
              <span className="text-amber-300 font-bold text-lg">
                {pointsData?.freeOutfitCredits}
              </span>
            </div>
            <p className="text-amber-400/70 text-xs mt-1">
              Bonus outfit generations (used automatically)
            </p>
          </div>
        )}

        {pointsData?.activeTrial && (
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">
                Premium Trial Active
              </span>
            </div>
            <p className="text-purple-400/70 text-xs mt-1">
              Expires: {new Date(pointsData.activeTrial.expiresAt).toLocaleString()}
            </p>
          </div>
        )}

        {pointsData?.activeDiscount && (
          <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">
                  Discount Code Available
                </span>
              </div>
              <code className="px-2 py-1 bg-green-500/20 rounded text-green-300 text-sm font-mono">
                {pointsData.activeDiscount.code}
              </code>
            </div>
            <p className="text-green-400/70 text-xs mt-1">
              ${(pointsData.activeDiscount.discountAmount / 100).toFixed(2)} off your next upgrade
            </p>
          </div>
        )}

        <div className="grid gap-3">
          <h4 className="text-gray-300 text-sm font-medium">Redeem Points</h4>
          {redemptionOptions.map((option) => {
            const Icon = option.icon;
            const canAfford = points >= option.cost;
            
            return (
              <div
                key={option.id}
                className={`p-4 rounded-lg border transition-all ${
                  canAfford
                    ? "bg-white/5 border-white/10 hover:border-purple-500/50"
                    : "bg-black/20 border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${canAfford ? "bg-purple-500/20" : "bg-gray-500/20"}`}>
                      <Icon className={`w-4 h-4 ${canAfford ? "text-purple-400" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <h5 className="text-white font-medium text-sm">{option.name}</h5>
                      <p className="text-gray-400 text-xs">{option.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={canAfford ? "default" : "ghost"}
                    disabled={!canAfford || redeemMutation.isPending}
                    onClick={() => redeemMutation.mutate(option.action)}
                    className={canAfford ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    {redeemMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{option.cost} pts</span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? "Hide" : "Show"} Transaction History
        </Button>

        {showHistory && pointsData?.transactions && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pointsData.transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No transactions yet
              </p>
            ) : (
              pointsData.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-white text-sm">{tx.description}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-medium ${
                      tx.points > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-2 border-t border-white/10">
          <p className="text-gray-500 text-xs text-center">
            Earn points by completing quizzes and generating outfits
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
