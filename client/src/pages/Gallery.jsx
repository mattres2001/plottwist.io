import React, { useEffect, useRef } from "react"
import { assets } from "../assets/assets.js"
import { useNavigate } from 'react-router-dom'

const Gallery = () => {
  const navigate = useNavigate()
  const galleryRef = useRef(null)

  // REPLACE IN FUTURE
  useEffect(() => {
    const imageUrls = [
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?q=80&w=2732&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1531384698654-7f6e477ca221?q=80&w=2800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1531901599143-df5010ab9438?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1524255684952-d7185b509571?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1588175996685-a40693ee1087?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ];

    const createImageElement = (url, index) => {
      const div = document.createElement("div");
      div.className = "relative overflow-hidden aspect-w-16 aspect-h-9 flex-shrink-0 w-80";
      const img = document.createElement("img");
      img.className =
        "object-cover w-full h-full opacity-0 lazy-image transition-opacity duration-300";
      img.dataset.src = url;
      img.alt = `Image ${index + 1}`;
      const placeholder = document.createElement("div");
      placeholder.className =
        "absolute inset-0 w-full h-full bg-base-200 animate-pulse";
      div.appendChild(placeholder);
      div.appendChild(img);
      return div;
    };

    const lazyLoad = () => {
      const images = document.querySelectorAll("img.lazy-image");
      const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      };
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.onload = () => {
              img.classList.remove("opacity-0");
              img.previousElementSibling.remove(); // Remove placeholder
            };
            observer.unobserve(img);
          }
        });
      }, options);
      images.forEach((img) => imageObserver.observe(img));
    };

    // Clear existing content
    if (galleryRef.current) {
      galleryRef.current.innerHTML = '';
      
      // Create and append image elements
      imageUrls.forEach((url, index) => {
        const imageElement = createImageElement(url, index);
        galleryRef.current.appendChild(imageElement);
      });
      
      // Initialize lazy loading
      lazyLoad();
    }
  }, []);

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
        
        <div className="w-full overflow-x-auto">
          <div ref={galleryRef} className="flex space-x-6">
            {/* Images will be dynamically inserted here */}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Gallery