import { useState, useEffect, ReactNode } from "react";

interface RotatingBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function RotatingBackground({ children, className = "" }: RotatingBackgroundProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    "/images/hero-fashion1.jpg",
    "/images/hero-fashion2.jpg",
    "/images/hero-fashion3.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
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
