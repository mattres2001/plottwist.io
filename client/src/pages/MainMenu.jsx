import React from 'react'
import {assets} from "../assets/assets.js"
import { useNavigate } from 'react-router-dom'

const MainMenu = () => {
  
  const navigate = useNavigate()

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      
      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-5">
        <a
          onClick={() => navigate("/host_session")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition shadow-lg "
        >
          Host Session
        </a>
        <a
          onClick={() => navigate("/join_session")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition shadow-lg "
        >
          Join Session
        </a>
        <a
          onClick={() => navigate("/gallery")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition shadow-lg "
        >
          Gallery
        </a>
      </div>
    </div>
  )
}

export default MainMenu