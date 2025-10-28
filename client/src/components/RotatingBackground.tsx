import { useState, useEffect, ReactNode } from "react";

interface RotatingBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function RotatingBackground({ children, className = "" }: RotatingBackgroundProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Fashion images for rotation - using actual available images
  const backgroundImages = [
    "/images/fashion-bg1.jpg",
    "/images/fashion-bg2.jpg",
    "/images/fashion-bg3.jpg",
    "/images/fashion-bg4.jpg",
    "/images/hero-fashion1.jpg",
    "/images/hero-fashion2.jpg",
    "/images/hero-fashion3.jpg",
    "/images/hero-main.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen relative text-white overflow-hidden ${className}`}>
      {/* Rotating Background Images */}
      {backgroundImages.map((image, index) => (
        <div
          key={image}
          className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${image})`,
            opacity: currentBgIndex === index ? 1 : 0,
            zIndex: 0
          }}
        />
      ))}
      
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/70 via-black/60 to-black/90" style={{ zIndex: 1 }} />
      
      {/* Content wrapper */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}