import { Card, CardContent } from "@/components/ui/card";
import { Brain, ShoppingBag, TrendingUp, Check } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="heading-features-title">
            Revolutionizing Fashion with <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-features-subtitle">
            Feel confident in every room. Never stress over what to wear to an event again. 
            A fun and gamified fashion experience. Shopping for your next event made easy.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Feature 1: AI Styling */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform group" data-testid="card-feature-ai-styling">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">AI-Personalized Styling</h3>
              <p className="text-gray-300">
                Tailored to your personality and preferences. Our AI learns your unique style to create perfect outfits.
              </p>
            </CardContent>
          </Card>
          
          {/* Feature 2: Instant Shopping */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform group" data-testid="card-feature-shopping">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Instant Shopping Access</h3>
              <p className="text-gray-300">
                Shop recommended pieces directly from top brands with our curated affiliate partnerships.
              </p>
            </CardContent>
          </Card>
          
          {/* Feature 3: Style Dashboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:scale-105 transition-transform group" data-testid="card-feature-dashboard">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Interactive Dashboard</h3>
              <p className="text-gray-300">
                Track your style evolution, save favorite looks, and manage your fashion collections.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Large feature showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-white mb-6" data-testid="heading-ai-assistant">
              Your Personal AI Fashion Assistant
            </h3>
            <div className="space-y-4">
              {[
                "Multi-step personality quiz for precise styling",
                "Event-specific outfit recommendations", 
                "Body type and preference optimization",
                "NFT-ready style collections"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-4" data-testid={`feature-item-${index}`}>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-8 h-8 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-400/30 flex items-center justify-center" data-testid="ai-interface-placeholder">
              <div className="text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-white text-lg font-medium">AI Fashion Styling Interface</p>
                <p className="text-gray-300 text-sm">Personalized recommendations powered by AI</p>
              </div>
            </div>
            
            {/* Floating UI elements */}
            <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20" data-testid="floating-ui-element">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-white">AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
