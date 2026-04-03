import React from 'react'
import StarRating from './StarRating'

const EndScreen = ({
  sessionRating,
  hoveredStar,
  setHoveredStar,
  ratingSubmitted,
  overallRating,
  showStoryboard,
  storyboardImage,
  onRate,
  onGenerateStoryboard,
}) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
    {!ratingSubmitted && (
      <span className="text-center font-bold text-4xl md:text-5xl text-white drop-shadow-lg mb-12">
        The End
      </span>
    )}
    <div className={`flex gap-8 items-center pointer-events-auto ${ratingSubmitted ? 'mt-0' : ''}`}>
      <div className="bg-black/60 text-white px-12 py-8 rounded-lg font-mono w-[500px]">
        {!ratingSubmitted ? (
          <>
            <p className="text-white text-2xl mb-6 text-center">Rate this session</p>
            <StarRating rating={sessionRating} onRate={onRate} hoveredStar={hoveredStar} onHover={setHoveredStar} size="6xl" />
          </>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <p className="text-white/80 text-lg mb-2">Your rating</p>
              <StarRating rating={sessionRating} size="4xl" />
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-yellow-400 font-bold text-xl">{sessionRating}</span>
                <span className="text-white/60 text-sm">/ 5</span>
              </div>
            </div>
            <div className="w-full border-t border-white/20" />
            <div className="text-center">
              <p className="text-white/80 text-lg mb-2">Community rating</p>
              {overallRating ? (
                <>
                  <StarRating rating={Math.round(overallRating)} size="4xl" />
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-yellow-400 font-bold text-xl">{overallRating.toFixed(1)}</span>
                    <span className="text-white/60 text-sm">/ 5</span>
                  </div>
                </>
              ) : (
                <div className="text-white/40 text-lg">Loading community ratings...</div>
              )}
            </div>
            {!showStoryboard && (
              <button
                onClick={onGenerateStoryboard}
                className="mt-4 bg-yellow-400 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Generate Storyboard →
              </button>
            )}
          </div>
        )}
      </div>
      {showStoryboard && (
        <div className="bg-black/60 text-white rounded-lg font-mono w-[500px] overflow-hidden">
          <h3 className="text-2xl font-bold py-4 px-6 text-center border-b border-white/20">Your Storyboard</h3>
          <img src={storyboardImage.url} alt={storyboardImage.title} className="object-cover w-full h-full" />
        </div>
      )}
    </div>
  </div>
)

export default EndScreen
