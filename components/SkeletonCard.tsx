import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-bg-card border border-border-color rounded-2xl overflow-hidden flex flex-col animate-pulse h-full">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-6 bg-white/5 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-4 bg-white/5 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-1/4" />
        </div>
        <div className="mt-auto pt-3 border-t border-white/5 space-y-4">
           <div className="flex justify-between items-center">
             <div className="h-4 bg-white/5 rounded w-1/3" />
             <div className="flex gap-2">
                <div className="h-8 w-8 bg-white/5 rounded-lg" />
                <div className="h-8 w-8 bg-white/5 rounded-lg" />
             </div>
           </div>
           <div className="h-12 bg-white/5 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
};