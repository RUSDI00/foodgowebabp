
import React, { useState } from 'react';

interface StarRatingInputProps {
  rating: number;
  setRating: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({ rating, setRating, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`focus:outline-none transition-colors duration-150 ${starSizeClass}
            ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}
            hover:text-yellow-300
          `}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <i className="fas fa-star"></i>
        </button>
      ))}
    </div>
  );
};

export default StarRatingInput;
