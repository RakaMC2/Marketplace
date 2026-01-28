import React from 'react';
import { Star, StarHalf } from 'lucide-react';

export const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const rounded = Math.round(rating * 2) / 2;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) {
      stars.push(<Star key={i} size={size} className="fill-yellow-400 text-yellow-400" />);
    } else if (rounded >= i - 0.5) {
      stars.push(<StarHalf key={i} size={size} className="fill-yellow-400 text-yellow-400" />);
    } else {
      stars.push(<Star key={i} size={size} className="text-gray-600" />);
    }
  }

  return <div className="flex gap-0.5">{stars}</div>;
};