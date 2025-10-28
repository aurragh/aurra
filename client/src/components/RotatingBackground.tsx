import { useState, useEffect, ReactNode } from "react";

interface RotatingBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function RotatingBackground({ children, className = "" }: RotatingBackgroundProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Curated fashion images for rotation (excluding studio shots with solid backgrounds)
  const backgroundImages = [
    "/images/fashion/image1_1761657039970.jpg",
    "/images/fashion/image4_1761657039971.jpg",
    "/images/fashion/image8_1761657039972.jpg",
    "/images/fashion/image9_1761657039967.jpg",
    "/images/fashion/image10_1761657039967.jpg",
    "/images/fashion/image13_1761657039968.jpg",
    "/images/fashion/image17_1761657039969.jpg",
    "/images/fashion/image21_1761658331217.jpg",
    "/images/fashion/image22_1761658331218.jpg",
    "/images/fashion/image23_1761658331218.jpg",
    "/images/fashion/image25_1761658331218.jpg",
    "/images/fashion/image26_1761658331219.jpg",
    "/images/fashion/image28_1761658331219.jpg",
    "/images/fashion/image31_1761658331220.jpg",
    "/images/fashion/image33_1761658331221.jpg",
    "/images/fashion/image34_1761658331221.jpg",
    "/images/fashion/image35_1761658331221.jpg",
    "/images/fashion/image39_1761658331222.jpg",
    "/images/fashion/image40_1761658331222.jpeg"
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
      
      {/* Very light overlay for text readability while preserving image visibility */}
      <div className="fixed inset-0 bg-black/30" style={{ zIndex: 1 }} />
      
      {/* Content wrapper */}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}