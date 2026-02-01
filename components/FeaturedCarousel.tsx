import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface FeaturedCarouselProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onImageChange?: (imageUrl: string) => void;
}

// Hook untuk optimize image
const useOptimizedImageSrc = (src: string | undefined) => {
  if (!src) return '';
  if (src.startsWith('data:')) return src;
  if (src.startsWith('blob:')) return src;

  try {
    const encodedUrl = encodeURIComponent(src);
    return `https://wsrv.nl/?url=${encodedUrl}&w=1200&q=85&output=webp&il`;
  } catch (e) {
    return src;
  }
};

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onItemClick, onImageChange }) => {
  const [index, setIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (items.length > 0 && onImageChange) {
      onImageChange(items[index].img);
    }
    // Reset image state saat index berubah
    setImageLoaded(false);
    setImageError(false);
  }, [index, items, onImageChange]);

  if (!items || items.length === 0) return null;

  const current = items[index];
  const optimizedImg = useOptimizedImageSrc(current.img);

  return (
    <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden mb-10 group shadow-2xl border border-white/10 bg-[#121214]">
      
      {/* 1. LAYER BACKGROUND (Paling Bawah) */}
      <div className="absolute inset-0 z-0">
        {items.map((item, i) => {
          const bgImg = useOptimizedImageSrc(item.img);
          return (
            <div 
              key={item.id || i}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
                i === index ? 'opacity-60' : 'opacity-0'
              }`}
              style={{
                backgroundImage: bgImg ? `url(${bgImg})` : 'none',
                filter: 'blur(20px)',
                backgroundColor: '#1a1a1e'
              }}
            />
          );
        })}
      </div>

      {/* 2. LAYER GAMBAR UTAMA (Focus Image) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center md:justify-end md:pr-20 opacity-20 md:opacity-40 pointer-events-none">
        <div className="relative w-full h-full md:w-[60%] md:h-[90%]">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-[#1a1a1e] rounded-3xl">
              <div className="text-center text-gray-500">
                <Star size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          ) : (
            <img 
              src={optimizedImg || current.img} 
              alt={current.title}
              className={`w-full h-full object-cover rounded-3xl transition-all duration-700 shadow-2xl ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error('Featured image failed to load:', current.img);
                // Fallback ke URL asli jika wsrv gagal
                if (e.currentTarget.src.includes('wsrv.nl') && current.img) {
                  e.currentTarget.src = current.img;
                } else {
                  setImageError(true);
                }
              }}
              loading="eager"
            />
          )}
        </div>
      </div>
      
      {/* 3. LAYER GRADIENT OVERLAY */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent" />
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#121214] via-transparent to-transparent hidden md:block" />

      {/* 4. LAYER KONTEN (Paling Atas) */}
      <div className="absolute inset-0 z-30 flex items-end">
        <div className="w-full p-6 md:p-12 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
            <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-left-6 duration-700">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500 text-black text-[10px] font-black uppercase tracking-tighter">
                    <Star size={12} fill="currentColor" /> Featured
                </span>
                
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                  {current.title}
                </h2>
                
                <p className="text-gray-300 line-clamp-2 max-w-xl text-sm md:text-lg leading-relaxed font-medium">
                  {current.desc?.replace(/[#*`]/g, '') || 'No description available'}
                </p>

                <div className="flex items-center gap-3 pt-2">
                    <div className="relative w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-[#1a1a1e]">
                      <img 
                        src={useOptimizedImageSrc(current.img)} 
                        className="w-full h-full object-cover" 
                        alt={current.author || 'Creator'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Creator</span>
                      <span className="text-sm font-bold text-white">{current.author || 'Member'}</span>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => onItemClick(current)}
                className="bg-primary hover:bg-white hover:text-black text-white px-10 py-4 rounded-2xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-2xl whitespace-nowrap text-sm md:text-base w-full md:w-auto tracking-tight"
            >
                OPEN PROJECT
            </button>
        </div>
      </div>

      {/* 5. NAVIGATION (Z-40) */}
      {items.length > 1 && (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + items.length) % items.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/5 hover:bg-primary text-white backdrop-blur-xl border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-40 hidden md:block"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % items.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/5 hover:bg-primary text-white backdrop-blur-xl border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-40 hidden md:block"
            >
                <ChevronRight size={24} />
            </button>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                {items.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          idx === index ? 'w-10 h-1.5 bg-primary' : 'w-2 h-1.5 bg-white/20'
                        }`}
                    />
                ))}
            </div>
        </>
      )}
    </div>
  );
}
