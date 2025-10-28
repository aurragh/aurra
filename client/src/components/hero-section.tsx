import { Button } from "@/components/ui/button";
import { Play, Sparkles, Gem } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

export default function HeroSection({ onGetStarted, onWatchDemo }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" data-testid="heading-hero-title">
            <span className="block text-white">Effortless and</span>
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Impactful
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light" data-testid="text-hero-subtitle">
            Your style, curated in seconds.
          </p>
          
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto" data-testid="text-hero-description">
            Discover style tailored effortlessly with Aurra AI—your personal fashion advisor for creating stunning looks every day.
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
              onClick={onGetStarted}
              data-testid="button-get-styled-now"
            >
              Get Styled Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 hidden lg:block" data-testid="floating-element-left">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
      </div>
      
      <div className="absolute bottom-20 right-10 hidden lg:block" data-testid="floating-element-right">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
          <Gem className="w-8 h-8 text-purple-400" />
        </div>
      </div>
    </section>
  );
}
