import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface FeaturedCarouselProps {
  items: Item[];
  onItemClick: (item: Item) => void;
  onImageChange?: (imageUrl: string) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onItemClick, onImageChange }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (items.length > 0 && onImageChange) {
      onImageChange(items[index].img);
    }
  }, [index, items, onImageChange]);

  if (!items.length) return null;

  const current = items[index];

  return (
    <div className="relative w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-10 group shadow-2xl border border-white/10">
      {/* Background with blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out blur-xl opacity-50 scale-110"
        style={{ backgroundImage: `url(${current.img})` }}
      />
      
      {/* Content Container */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end">
        <div className="w-full p-6 md:p-10 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
            <div className="flex-1 space-y-2 animate-fade-in w-full md:w-auto">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30 backdrop-blur-sm">
                    <Star size={12} fill="currentColor" /> FEATURED
                </span>
                <h2 className="text-2xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg line-clamp-1">{current.title}</h2>
                <p className="text-gray-200 line-clamp-2 max-w-2xl text-xs md:text-base drop-shadow-md">{current.desc.substring(0, 150)}...</p>
                <div className="flex items-center gap-3 pt-2">
                    <img src={current.img} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/30" alt="" />
                    <span className="text-xs md:text-sm font-medium">{current.author}</span>
                </div>
            </div>
            
            <button 
                onClick={() => onItemClick(current)}
                className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] whitespace-nowrap text-sm md:text-base w-full md:w-auto text-center"
            >
                Check it out
            </button>
        </div>
      </div>

      {/* Controls */}
      {items.length > 1 && (
        <>
            <button 
                onClick={() => setIndex((index - 1 + items.length) % items.length)}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft />
            </button>
            <button 
                onClick={() => setIndex((index + 1) % items.length)}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight />
            </button>
            
            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {items.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setIndex(idx)}
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${idx === index ? 'w-4 md:w-6 bg-white' : 'bg-white/40 hover:bg-white/80'}`}
                    />
                ))}
            </div>
        </>
      )}
    </div>
  );
};
