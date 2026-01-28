import React, { useState, useMemo } from 'react';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, containerClassName }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Optimize Image URL using wsrv.nl CDN for external links
  // This automatically resizes, compresses, and converts to WebP
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    
    // If it's already a base64 string, we can't optimize it via CDN proxy
    if (src.startsWith('data:')) return src;
    
    // If it's a blob url (local preview), return as is
    if (src.startsWith('blob:')) return src;

    // Use wsrv.nl proxy
    // w=800: Resize to width 800px (good balance for cards/details)
    // q=80: Quality 80%
    // output=webp: Force WebP format for speed
    // il: Incremental loading
    try {
        const encodedUrl = encodeURIComponent(src);
        return `https://wsrv.nl/?url=${encodedUrl}&w=800&q=80&output=webp&il`;
    } catch (e) {
        return src;
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-bg-card ${containerClassName || 'w-full h-full'}`}>
      {/* Placeholder / Skeleton */}
      {!loaded && !error && (
        <div 
          className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center z-10"
        >
          <svg className="w-8 h-8 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      <img 
        src={optimizedSrc} 
        alt={alt || ''} 
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        className={`${className} transition-all duration-700 ease-in-out ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}`}
      />
      
      {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card text-gray-600 text-xs">
              Failed to load
          </div>
      )}
    </div>
  );
};