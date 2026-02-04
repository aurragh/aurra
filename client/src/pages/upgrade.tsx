import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";
import { Check, Crown, Sparkles, ArrowLeft, Zap, Ticket, X } from "lucide-react";
import { RotatingBackground } from "@/components/RotatingBackground";
import PayPalButton from "@/components/PayPalButton";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0",
    description: "Get started with basic features",
    features: [
      "3 outfit recommendations per month",
      "Basic style profile",
      "Standard AI responses",
    ],
    current: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "9.99",
    description: "Unlock full Aurra experience",
    features: [
      "Unlimited outfit recommendations",
      "Advanced style analysis",
      "Priority AI processing",
      "Shopping link integration",
      "Save and organize collections",
      "Early access to new features",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "24.99",
    description: "For serious decision-makers",
    features: [
      "Everything in Premium",
      "Personal style consultation",
      "Wardrobe inventory tracking",
      "Event-specific recommendations",
      "Direct support line",
      "White-glove onboarding",
    ],
  },
];

export default function Upgrade() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);

  // Fetch points data to check for available discount codes
  const { data: pointsData } = useQuery<{
    activeDiscount: { code: string; discountAmount: number } | null;
  }>({
    queryKey: ["/api/points"],
  });

  // Auto-apply discount code from points redemption
  useEffect(() => {
    if (pointsData?.activeDiscount && !appliedDiscount) {
      // discountAmount is stored in cents, convert to dollars
      setAppliedDiscount({
        code: pointsData.activeDiscount.code,
        amount: pointsData.activeDiscount.discountAmount / 100,
      });
      setDiscountCode(pointsData.activeDiscount.code);
    }
  }, [pointsData, appliedDiscount]);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "Please log in to upgrade.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const upgradeMutation = useMutation({
    mutationFn: async ({ plan, discountCode }: { plan: string; discountCode?: string }) => {
      const response = await apiRequest("POST", "/api/upgrade", { plan, discountCode });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upgrade Successful",
        description: "Your subscription has been upgraded. Enjoy your new features.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to upgrade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") return;
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const currentSubscription = (user as any)?.subscriptionStatus || "free";
  const initialSubscriptionRef = useRef(currentSubscription);

  // Poll for subscription changes after showing payment form
  useEffect(() => {
    if (!showPayment) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/user", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          const newStatus = userData?.subscriptionStatus || "free";
          if (newStatus !== initialSubscriptionRef.current && newStatus !== "free") {
            clearInterval(pollInterval);
            toast({
              title: "Payment Successful",
              description: `Your ${newStatus} subscription is now active.`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/dashboard");
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [showPayment, toast, setLocation]);

  if (isLoading) {
    return (
      <RotatingBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </RotatingBackground>
    );
  }

  return (
    <RotatingBackground>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Upgrade Your Experience
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Unlock the full power of Aurra. Make better decisions, faster.
            </p>
          </div>

          {showPayment && selectedPlan ? (
            <Card className="max-w-md mx-auto bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                  Complete Your Upgrade
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {(() => {
                    const basePrice = selectedPlan === "premium" ? 9.99 : 24.99;
                    const discountedPrice = appliedDiscount 
                      ? Math.max(0, basePrice - appliedDiscount.amount).toFixed(2)
                      : basePrice.toFixed(2);
                    
                    if (appliedDiscount) {
                      return (
                        <span className="flex items-center gap-2">
                          <span className="line-through text-gray-500">${basePrice.toFixed(2)}/month</span>
                          <span className="text-green-400 font-bold">${discountedPrice}/month</span>
                        </span>
                      );
                    }
                    return `${selectedPlan === "premium" ? "Premium" : "Pro"} - $${basePrice.toFixed(2)}/month`;
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {appliedDiscount && (
                  <div className="flex items-center justify-between p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 text-sm">
                        Discount code applied: <span className="font-mono font-bold">{appliedDiscount.code}</span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-white h-6 w-6 p-0"
                      onClick={() => {
                        setAppliedDiscount(null);
                        setDiscountCode("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-4">
                    Complete your payment with PayPal to unlock all features.
                  </p>
                  <PayPalButton 
                    amount={(() => {
                      const basePrice = selectedPlan === "premium" ? 9.99 : 24.99;
                      return appliedDiscount 
                        ? Math.max(0, basePrice - appliedDiscount.amount).toFixed(2)
                        : basePrice.toFixed(2);
                    })()}
                    currency="USD"
                    intent="CAPTURE"
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-4">
                    Secure payment processed by PayPal
                  </p>
                  <Button 
                    variant="ghost" 
                    className="text-gray-400 hover:text-white"
                    onClick={() => setShowPayment(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-gray-400 text-xs text-center mb-2">
                    For testing, you can activate premium instantly:
                  </p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => upgradeMutation.mutate({ 
                      plan: selectedPlan, 
                      discountCode: appliedDiscount?.code 
                    })}
                    disabled={upgradeMutation.isPending}
                  >
                    {upgradeMutation.isPending ? "Activating..." : "Activate Premium (Test Mode)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription === plan.id;
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative bg-white/10 backdrop-blur-sm border-white/20 transition-all hover:scale-105 ${
                      plan.popular ? "ring-2 ring-purple-500" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white px-4">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pt-8">
                      <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                        {plan.price !== "0" && (
                          <span className="text-gray-400">/month</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-gray-300">
                            <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button
                        className={`w-full ${
                          isCurrentPlan 
                            ? "bg-gray-600 cursor-not-allowed" 
                            : plan.popular 
                              ? "bg-purple-600 hover:bg-purple-700" 
                              : "bg-white/20 hover:bg-white/30"
                        }`}
                        disabled={isCurrentPlan || plan.id === "free"}
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        {isCurrentPlan ? (
                          "Current Plan"
                        ) : plan.id === "free" ? (
                          "Free Forever"
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RotatingBackground>
  );
}
