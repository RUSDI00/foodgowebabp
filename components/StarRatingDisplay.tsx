
import React from 'react';

interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({ rating, maxStars = 5, size = 'sm' }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

  const starSizeClass = {
    sm: 'text-sm', // text-yellow-400
    md: 'text-lg',
    lg: 'text-xl',
  }[size];

  return (
    <div className={`flex items-center text-yellow-400 ${starSizeClass}`}>
      {[...Array(fullStars)].map((_, i) => (
        <i key={`full-${i}`} className="fas fa-star"></i>
      ))}
      {halfStar && <i key="half" className="fas fa-star-half-alt"></i>}
      {[...Array(emptyStars)].map((_, i) => (
        <i key={`empty-${i}`} className="far fa-star text-gray-300"></i>
      ))}
    </div>
  );
};

export default StarRatingDisplay;
