import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Demo mode - bypass authentication check
  const isDemoMode = window.location.search.includes('demo=true');
  
  // Redirect to login if not authenticated (unless in demo mode)
  useEffect(() => {
    if (!isDemoMode && !isLoading && !user) {
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
  }, [user, isLoading, toast, isDemoMode]);

  if (isLoading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-950">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  const testimonials = [
    {
      quote: "I finally feel confident walking into any room—Aurra just gets my style.",
      author: "Kelsey R., Creative Strategist",
      image: "/images/fashion-bg1.jpg"
    },
    {
      quote: "Aurra transformed my wardrobe and gave me the confidence I needed.",
      author: "Sarah M., Marketing Director",
      image: "/images/fashion-bg2.jpg"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white" data-testid="heading-brand">
              Aurra
            </h1>
            <button className="text-white" data-testid="button-menu">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16" data-testid="section-hero">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/images/hero-main.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-purple-900/40 to-black/80" />
        
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight" data-testid="heading-hero">
            Discover style tailored effortlessly with Aurra AI—your personal fashion advisor for crafting stunning looks every day.
          </h2>
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-12 py-6 rounded-full font-semibold"
              data-testid="button-get-styled"
            >
              Get Styled Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Revolutionizing Fashion Section */}
      <section className="py-20 px-4" data-testid="section-revolution">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden mb-8">
            <img 
              src="/images/hero-fashion3.jpg" 
              alt="Fashion"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold" data-testid="heading-revolution">
              Revolutionizing Fashion with AI
            </h2>
            <div className="space-y-3 text-lg text-gray-300">
              <p data-testid="text-feature-1">Feel confident in every room.</p>
              <p data-testid="text-feature-2">Never stress over what to wear to an event again.</p>
              <p data-testid="text-feature-3">A fun and gamified fashion experience.</p>
              <p data-testid="text-feature-4">Shopping for your next event made easy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Fashion Solutions */}
      <section className="py-20 px-4" data-testid="section-solutions">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12" data-testid="heading-solutions">
            Personalized Fashion Solutions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* AI-Personalized Styling */}
            <div className="relative rounded-3xl overflow-hidden group" data-testid="card-ai-styling">
              <img 
                src="/images/fashion-bg3.jpg" 
                alt="AI Styling"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">AI-Personalized Styling</h3>
                  <p className="text-gray-300">Tailored to your personality and preferences.</p>
                </div>
              </div>
            </div>

            {/* Instant Shopping Access */}
            <div className="relative rounded-3xl overflow-hidden group" data-testid="card-shopping">
              <img 
                src="/images/hero-fashion1.jpg" 
                alt="Shopping Access"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end">
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">Instant Shopping Access</h3>
                  <p className="text-gray-300">No more endless scrolling.</p>
                </div>
              </div>
            </div>

            {/* Effortless and Impactful */}
            <div className="relative rounded-3xl overflow-hidden group md:col-span-2" data-testid="card-effortless">
              <img 
                src="/images/hero-fashion2.jpg" 
                alt="Effortless Styling"
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end">
                <div className="p-8">
                  <h3 className="text-3xl font-bold mb-2">Effortless and Impactful</h3>
                  <p className="text-gray-300 text-lg">Your style, curated in seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-purple-950" data-testid="section-testimonials">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-purple-300 mb-2" data-testid="label-testimonials">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold" data-testid="heading-testimonials">
              Hear from Our Satisfied Users
            </h2>
            <p className="text-gray-300 mt-4 text-lg" data-testid="text-testimonial-intro">
              Aurra AI revolutionizes online shopping, delivering personalized styling and enhancing fashion experiences with remarkable efficiency and flair.
            </p>
          </div>

          <div className="relative bg-purple-900/30 backdrop-blur-sm rounded-3xl p-8 md:p-12" data-testid="card-testimonial">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src={testimonials[currentTestimonial].image} 
                  alt="Testimonial"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-xl md:text-2xl mb-4 italic" data-testid="text-testimonial-quote">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <p className="text-gray-400" data-testid="text-testimonial-author">
                  — {testimonials[currentTestimonial].author}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button 
                onClick={prevTestimonial}
                className="w-12 h-12 rounded-full bg-white text-purple-900 flex items-center justify-center hover:bg-gray-200 transition"
                data-testid="button-testimonial-prev"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextTestimonial}
                className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
                data-testid="button-testimonial-next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-white/10" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4" data-testid="heading-footer-brand">Aurra</h3>
          <p className="text-gray-400" data-testid="text-footer-tagline">
            Made with <span className="text-purple-400">Replit</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
