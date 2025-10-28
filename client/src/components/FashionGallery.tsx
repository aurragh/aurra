import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function FashionGallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fashion images for the gallery (39 images)
  const galleryImages = [
    "/images/fashion/image1_1761657039970.jpg",
    "/images/fashion/image2_1761657039971.jpg",
    "/images/fashion/image3_1761657039971.jpg",
    "/images/fashion/image4_1761657039971.jpg",
    "/images/fashion/image5_1761657039971.jpg",
    "/images/fashion/image6_1761657039972.jpg",
    "/images/fashion/image7_1761657039972.jpg",
    "/images/fashion/image8_1761657039972.jpg",
    "/images/fashion/image9_1761657039967.jpg",
    "/images/fashion/image10_1761657039967.jpg",
    "/images/fashion/image11_1761657039968.jpg",
    "/images/fashion/image12_1761657039968.jpg",
    "/images/fashion/image13_1761657039968.jpg",
    "/images/fashion/image14_1761657039969.jpg",
    "/images/fashion/image15_1761657039969.jpg",
    "/images/fashion/image16_1761657039969.jpg",
    "/images/fashion/image17_1761657039969.jpg",
    "/images/fashion/image18_1761657039970.jpg",
    "/images/fashion/image19_1761657039970.jpg",
    "/images/fashion/image20_1761657039970.jpg",
    "/images/fashion/image21_1761658331217.jpg",
    "/images/fashion/image22_1761658331218.jpg",
    "/images/fashion/image23_1761658331218.jpg",
    "/images/fashion/image24_1761658331218.jpg",
    "/images/fashion/image25_1761658331218.jpg",
    "/images/fashion/image26_1761658331219.jpg",
    "/images/fashion/image27_1761658331219.jpg",
    "/images/fashion/image28_1761658331219.jpg",
    "/images/fashion/image29_1761658331219.jpg",
    "/images/fashion/image30_1761658331220.jpg",
    "/images/fashion/image31_1761658331220.jpg",
    "/images/fashion/image32_1761658331220.jpg",
    "/images/fashion/image33_1761658331221.jpg",
    "/images/fashion/image34_1761658331221.jpg",
    "/images/fashion/image35_1761658331221.jpg",
    "/images/fashion/image37_1761658331222.jpg",
    "/images/fashion/image38_1761658331222.jpg",
    "/images/fashion/image39_1761658331222.jpg",
    "/images/fashion/image40_1761658331222.jpeg"
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4" data-testid="heading-gallery-title">
            Fashion Inspiration Gallery
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto" data-testid="text-gallery-subtitle">
            Explore our curated collection of haute couture and contemporary fashion styles. 
            Each image represents the cutting-edge aesthetic that Aurra AI brings to your personal style journey.
          </p>
        </div>

        {/* Masonry Grid Gallery */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="break-inside-avoid group relative overflow-hidden rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
              onClick={() => setSelectedImage(image)}
              data-testid={`gallery-image-${index}`}
            >
              <img
                src={image}
                alt={`Fashion style ${index + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm font-semibold">Style #{index + 1}</p>
                  <p className="text-xs text-purple-200">Click to view</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-purple-200 mb-6" data-testid="text-gallery-cta">
            Ready to discover your unique fashion identity?
          </p>
          <a
            href="/style-quiz"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            data-testid="button-gallery-cta"
          >
            Start Your Style Journey
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-black/95 border-purple-500/20">
          <div className="relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              data-testid="button-close-lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Fashion detail view"
                className="w-full h-full max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}