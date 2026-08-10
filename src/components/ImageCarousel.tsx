import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, User } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  altText: string;
}

export default function ImageCarousel({ images, altText }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
        <User className="h-16 w-16" />
      </div>
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const renderImage = (className: string) => (
    <img 
      src={images[currentIndex]} 
      alt={`${altText} ${currentIndex + 1}`} 
      className={className}
      onContextMenu={handleContextMenu}
      draggable={false}
      onClick={toggleFullscreen}
    />
  );

  return (
    <>
      <div className="relative w-full h-full group cursor-pointer">
        {renderImage("w-full h-full object-cover")}
        
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={toggleFullscreen}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={toggleFullscreen}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center">
            <img 
              src={images[currentIndex]} 
              alt={`${altText} ${currentIndex + 1} fullscreen`} 
              className="max-w-full max-h-[90vh] object-contain"
              onContextMenu={handleContextMenu}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
