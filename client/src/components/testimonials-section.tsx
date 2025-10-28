import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Kelsey R.",
    role: "Creative Strategist",
    image: "/images/testimonial-kelsey.jpg",
    quote: "I finally feel confident walking into any room—Aurra just gets my style.",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus T.",
    role: "Business Executive", 
    image: "/images/testimonial-marcus.jpg",
    quote: "Aurra transformed my wardrobe and saved me hours of shopping. The AI recommendations are spot-on!",
    rating: 5
  },
  {
    id: 3,
    name: "Sarah L.",
    role: "Marketing Director",
    image: "/images/testimonial-sarah.jpg",
    quote: "The personalized recommendations are incredible. I've never felt more confident in my style choices.",
    rating: 5
  },
  {
    id: 4,
    name: "David C.",
    role: "Software Engineer",
    image: "/images/testimonial-marcus.jpg",
    quote: "As someone who struggled with fashion, Aurra made styling effortless. I love my new wardrobe!",
    rating: 5
  },
  {
    id: 5,
    name: "Emily W.",
    role: "Entrepreneur",
    image: "/images/testimonial-kelsey.jpg",
    quote: "The AI understands my style better than I do. Every recommendation is perfect for my lifestyle.",
    rating: 5
  },
  {
    id: 6,
    name: "Alex M.",
    role: "Designer",
    image: "/images/testimonial-marcus.jpg",
    quote: "Aurra elevated my professional wardrobe. The style insights are incredibly valuable.",
    rating: 5
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 3) % testimonials.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 3 + testimonials.length) % testimonials.length);
  };

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ];

  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-purple-400 font-semibold mb-4 text-sm uppercase tracking-wider" data-testid="text-testimonials-label">
            Testimonials
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white" data-testid="heading-testimonials-title">
            Hear from Our Satisfied Users
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto" data-testid="text-testimonials-subtitle">
            Aurra AI revolutionizes online shopping, delivering personalized styling and enhancing 
            fashion experiences with remarkable efficiency and flair.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleTestimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-testimonial-${testimonial.id}`}>
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image}
                    alt={`${testimonial.name} testimonial photo`}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                    data-testid={`img-testimonial-${testimonial.id}`}
                  />
                  <div>
                    <h4 className="font-semibold text-white" data-testid={`text-name-${testimonial.id}`}>
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-300 text-sm" data-testid={`text-role-${testimonial.id}`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4" data-testid={`text-quote-${testimonial.id}`}>
                  "{testimonial.quote}"
                </p>
                <div className="flex text-purple-400" data-testid={`rating-${testimonial.id}`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Navigation arrows for testimonial carousel */}
        <div className="flex justify-center mt-12 space-x-4">
          <Button 
            variant="outline"
            size="icon"
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white w-12 h-12 rounded-full"
            onClick={previousTestimonial}
            data-testid="button-previous-testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline"
            size="icon"
            className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white w-12 h-12 rounded-full"
            onClick={nextTestimonial}
            data-testid="button-next-testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
