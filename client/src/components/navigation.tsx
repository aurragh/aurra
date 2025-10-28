import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface NavigationProps {
  onLogin?: () => void;
  onSignup?: () => void;
}

export default function Navigation({ onLogin, onSignup }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSignup = () => {
    window.location.href = "/api/login";
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const navLinks = [
    { href: "features", label: "Features" },
    { href: "how-it-works", label: "How It Works" },
    { href: "pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-brand">
              Aurra
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-gray-300 hover:text-white transition-colors"
                data-testid={`link-${link.href}`}
              >
                {link.label}
              </button>
            ))}
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white"
              onClick={onLogin || handleLogin}
              data-testid="button-login"
            >
              Login
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={onSignup || handleSignup}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
          
          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-white"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-900 border-white/10" data-testid="sheet-mobile-menu">
              <div className="flex flex-col space-y-6 mt-8">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                    data-testid={`mobile-link-${link.href}`}
                  >
                    {link.label}
                  </button>
                ))}
                
                <div className="flex flex-col space-y-4 pt-6 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={onLogin || handleLogin}
                    data-testid="button-mobile-login"
                  >
                    Login
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    onClick={onSignup || handleSignup}
                    data-testid="button-mobile-get-started"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
