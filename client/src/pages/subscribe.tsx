import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { ArrowLeft, Check, Star, Sparkles, Crown } from "lucide-react";
import { RotatingBackground } from "@/components/RotatingBackground";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Aurra Premium!",
      });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-payment-form">
      <CardHeader>
        <CardTitle className="text-white text-center">Complete Your Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement data-testid="payment-element" />
          <Button 
            type="submit" 
            disabled={!stripe}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            data-testid="button-subscribe"
          >
            Subscribe to Premium
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

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

  useEffect(() => {
    if (user) {
      // Create subscription as soon as the page loads
      apiRequest("POST", "/api/create-subscription")
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
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
            description: "Failed to initialize subscription. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <RotatingBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </RotatingBackground>
    );
  }

  if (!clientSecret) {
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Subscribe
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white text-lg">Setting up your subscription...</p>
          </div>
        </div>
      </RotatingBackground>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-subscribe">
                Subscribe to Premium
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Plan Features */}
          <div>
            <div className="text-center lg:text-left mb-8">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <Crown className="w-8 h-8 text-purple-400 mr-3" />
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  data-testid="badge-most-popular"
                >
                  Most Popular
                </Badge>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4" data-testid="heading-premium-plan">
                Aurra Premium
              </h2>
              <div className="mb-4">
                <span className="text-5xl font-bold text-white">$9.99</span>
                <span className="text-gray-300 text-xl">/month</span>
              </div>
              <p className="text-gray-300 text-lg">
                Unlock the full power of AI-driven personal styling
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-premium-features">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Comprehensive style analysis & personality quiz",
                  "Unlimited AI outfit recommendations",
                  "Advanced shopping integration with affiliate links",
                  "Interactive style dashboard & outfit collections",
                  "Points & rewards system with level progression", 
                  "Save and organize unlimited outfit combinations",
                  "Priority customer support",
                  "Early access to new features",
                  "Style trend insights and seasonal recommendations"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3" data-testid={`feature-${index}`}>
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-400/30" data-testid="card-guarantee">
              <div className="flex items-center mb-3">
                <Star className="w-5 h-5 text-purple-400 mr-2" />
                <h3 className="text-white font-semibold">30-Day Satisfaction Guarantee</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Not happy with your style recommendations? Cancel within 30 days for a full refund.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            {stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-payment-unavailable">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-purple-400 mr-3" />
                    <h3 className="text-2xl font-semibold text-white">Coming Soon</h3>
                  </div>
                  <p className="text-gray-300 mb-6">
                    Payment processing is currently being set up. We're working on bringing you the best payment experience with PayPal integration.
                  </p>
                  <Button 
                    disabled
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-50"
                    data-testid="button-subscribe-disabled"
                  >
                    Payment Coming Soon
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-4">
                Secure payment powered by Stripe. Cancel anytime.
              </p>
              <div className="flex justify-center items-center space-x-4 text-gray-500">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.319 7.775v8.45c0 .896.725 1.621 1.622 1.621h18.118c.896 0 1.621-.725 1.621-1.621v-8.45H1.319zm1.622-1.081h18.118c.896 0 1.621-.725 1.621-1.621V3.452c0-.896-.725-1.621-1.621-1.621H2.941c-.897 0-1.622.725-1.622 1.621v1.621c0 .896.725 1.621 1.622 1.621z"/>
                </svg>
                <span className="text-sm">SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RotatingBackground>
  );
}
