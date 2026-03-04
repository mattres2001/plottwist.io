import React, { useCallback, useEffect, useRef, useState } from "react"
import { assets } from "../assets/assets.js"
import { useNavigate } from 'react-router-dom'

const MOCK_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Neon City Streets",
    rating: "4.8"
  },
  {
    url: "https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?q=80&w=2732&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Cyberpunk Skyline",
    rating: "4.9"
  },
  {
    url: "https://images.unsplash.com/photo-1531384698654-7f6e477ca221?q=80&w=2800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Desert Dreamscape",
    rating: "4.6"
  },
  {
    url: "https://images.unsplash.com/photo-1531901599143-df5010ab9438?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Forest Gateway",
    rating: "4.7"
  },
  {
    url: "https://images.unsplash.com/photo-1524255684952-d7185b509571?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Library of Echoes",
    rating: "4.5"
  },
  {
    url: "https://images.unsplash.com/photo-1588175996685-a40693ee1087?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Midnight Lab",
    rating: "4.9"
  },
  {
    url: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Writer's Haven",
    rating: "4.4"
  },
  {
    url: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Parallel Worlds",
    rating: "4.8"
  },
]

const Gallery = () => {
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  const PAGE_SIZE = 4

  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) return

    isLoadingRef.current = true
    setIsLoading(true)

    // In the future, replace this block with a real API call
    // that fetches document previews from MongoDB, e.g.:
    // const res = await fetch(`/api/gallery?page=${page}&limit=${PAGE_SIZE}`)
    // const data = await res.json()

    const start = page * PAGE_SIZE
    const end = start + PAGE_SIZE
    const nextSlice = MOCK_IMAGES.slice(start, end)

    if (nextSlice.length === 0) {
      setHasMore(false)
      isLoadingRef.current = false
      setIsLoading(false)
      return
    }

    setItems(prev => [...prev, ...nextSlice])
    setPage(prev => prev + 1)

    isLoadingRef.current = false
    setIsLoading(false)
  }, [hasMore, page, PAGE_SIZE])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e) => {
      
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }

    const handleScroll = () => {
      const distanceFromRight = el.scrollWidth - el.scrollLeft - el.clientWidth
      if (distanceFromRight < 200) {
        loadMore()
      }
    }

    el.addEventListener("scroll", handleScroll)
    el.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      el.removeEventListener("scroll", handleScroll)
      el.removeEventListener("wheel", handleWheel)
    }
  }, [loadMore])

  return (
    <div className="relative h-screen w-screen overflow-hidden">
 
      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />

      <div className="relative z-10 flex items-center h-full px-10">

        <a
          onClick={() => navigate(-1)}
          className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 cursor-pointer"
        >
          Go Back
        </a>
        
        <div ref={scrollRef} className="w-full overflow-x-auto hide-scrollbar">
          <div className="flex space-x-6">
            {items.map((image, index) => (
              <div
                key={`${image.title}-${index}`}
                className="relative group overflow-hidden aspect-w-16 aspect-h-9 flex-shrink-0 w-80 rounded-xl shadow-lg cursor-pointer"
              >
                <img
                  src={image.url}
                  alt={image.title || `Image ${index + 1}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white flex flex-col justify-end p-4 text-sm">
                  <div className="font-semibold text-base mb-1">
                    {image.title}
                  </div>
                  <div className="text-xs text-gray-200">
                    Rating: {image.rating}/5 · {image.info}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center justify-center w-80 text-white/70 text-sm">
                Loading more previews...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Gallery