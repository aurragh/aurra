import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturesSection from "@/components/features-section";
import TestimonialsSection from "@/components/testimonials-section";
import PricingSection from "@/components/pricing-section";
import { FashionGallery } from "@/components/FashionGallery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, ChartLine, Brain, Check, Star, Users, Shield } from "lucide-react";
import { RotatingBackground } from "@/components/RotatingBackground";

export default function Landing() {
  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo video modal
    console.log("Watch demo clicked");
  };

  return (
    <RotatingBackground className="bg-transparent text-foreground">
      <Navigation />
      <HeroSection onGetStarted={handleGetStarted} onWatchDemo={handleWatchDemo} />
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="heading-how-it-works">How It Works</h2>
            <p className="text-xl text-muted-foreground" data-testid="text-how-it-works-subtitle">Get styled in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="step-1">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Take Style Quiz</h3>
              <p className="text-muted-foreground">
                Complete our comprehensive personality and style preference quiz to help our AI understand your unique taste.
              </p>
            </div>
            
            <div className="text-center" data-testid="step-2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI Generates Looks</h3>
              <p className="text-muted-foreground">
                Our advanced AI creates personalized outfit recommendations based on your profile, body type, and occasion.
              </p>
            </div>
            
            <div className="text-center" data-testid="step-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Shop & Style</h3>
              <p className="text-muted-foreground">
                Save your favorite looks, shop recommended pieces, and build your perfect wardrobe with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection onSelectPlan={handleGetStarted} />
      
      {/* Fashion Inspiration Gallery */}
      <FashionGallery />
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-cta">
            Ready to Transform Your Style?
          </h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-cta-subtitle">
            Join thousands of users who've discovered their perfect style with Aurra AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
              onClick={handleGetStarted}
              data-testid="button-start-journey"
            >
              Start Your Style Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 text-lg"
              onClick={handleWatchDemo}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center items-center space-x-8 text-muted-foreground">
            <div className="flex items-center" data-testid="stat-users">
              <Users className="w-5 h-5 mr-2" />
              <span>10K+ Users</span>
            </div>
            <div className="flex items-center" data-testid="stat-rating">
              <Star className="w-5 h-5 mr-2" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center" data-testid="stat-secure">
              <Shield className="w-5 h-5 mr-2" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4" data-testid="heading-footer-brand">
                Aurra
              </h3>
              <p className="text-muted-foreground mb-4" data-testid="text-footer-description">
                AI-powered personal fashion styling that revolutionizes how you discover and shop for your perfect style.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-purple-400 transition-colors" data-testid="link-instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-purple-400 transition-colors" data-testid="link-twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-purple-400 transition-colors" data-testid="link-linkedin">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4" data-testid="heading-footer-product">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-features">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors" data-testid="link-how-it-works">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-api">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4" data-testid="heading-footer-company">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-about">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-blog">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-careers">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4" data-testid="heading-footer-support">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-help">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-cookies">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground" data-testid="text-footer-copyright">
            <p>&copy; 2024 Aurra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </RotatingBackground>
  );
}
