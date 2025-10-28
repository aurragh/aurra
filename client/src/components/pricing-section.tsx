import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
}

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    popular: false,
    features: [
      "Basic style quiz",
      "3 AI outfit recommendations",
      "Basic shopping integration"
    ]
  },
  {
    id: "premium", 
    name: "Premium",
    price: "$9.99",
    period: "/month",
    popular: true,
    features: [
      "Comprehensive style analysis",
      "Unlimited AI recommendations", 
      "Advanced shopping features",
      "Style dashboard & collections",
      "Rewards & points system"
    ]
  },
  {
    id: "pro",
    name: "Pro", 
    price: "$19.99",
    period: "/month",
    popular: false,
    features: [
      "Everything in Premium",
      "NFT style collection minting",
      "Priority AI processing",
      "Personal style consultant",
      "Advanced analytics"
    ]
  }
];

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" data-testid="heading-pricing-title">
            Choose Your Style Plan
          </h2>
          <p className="text-xl text-gray-300" data-testid="text-pricing-subtitle">
            Unlock premium features and personalized styling
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`bg-white/10 backdrop-blur-sm border-white/20 relative ${
                plan.popular ? 'border-2 border-purple-400' : ''
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2" data-testid="badge-most-popular">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-sm font-medium">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-white mb-4" data-testid={`text-plan-name-${plan.id}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white" data-testid={`text-plan-price-${plan.id}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-300" data-testid={`text-plan-period-${plan.id}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center" data-testid={`feature-${plan.id}-${index}`}>
                      <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 font-medium rounded-lg transition-colors ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'border border-white/20 bg-transparent hover:bg-white/10 text-white'
                  }`}
                  onClick={() => onSelectPlan(plan.id)}
                  data-testid={`button-select-${plan.id}`}
                >
                  {plan.id === 'basic' ? 'Get Started' : 
                   plan.id === 'premium' ? 'Upgrade to Premium' : 'Choose Pro'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
