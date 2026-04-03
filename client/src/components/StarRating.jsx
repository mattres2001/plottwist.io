import React from 'react'

const StarRating = ({ rating, onRate, hoveredStar, onHover, size = "6xl" }) => (
  <div className="flex gap-2 justify-center" onMouseLeave={() => onHover && onHover(0)}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = (hoveredStar || rating) >= star
      return (
        <span
          key={star}
          className={`${onRate ? 'cursor-pointer' : ''} text-${size} leading-none transition-colors duration-150 ${filled ? 'text-yellow-400' : 'text-white/40'}`}
          onMouseEnter={() => onHover && onHover(star)}
          onClick={() => onRate && onRate(star)}
        >
          {filled ? '★' : '☆'}
        </span>
      )
    })}
  </div>
)

export default StarRating
