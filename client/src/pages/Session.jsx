import React, { useState } from 'react'
import {assets} from "../assets/assets.js"
import { useNavigate } from 'react-router-dom'

const Session = () => {
  
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      
      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          setShowConfirm(true)
        }}
        className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200"
      >
        Go Back
      </a>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-lg mb-4">Are you sure you want to leave?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  navigate('/')
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-5">
        <a
          onClick={() => navigate("/host_session")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition"
        >
          Host Session
        </a>
        <a
          onClick={() => navigate("/join_session")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition"
        >
          Join Session
        </a>
        <a
          onClick={() => navigate("/gallery")}
          className="px-6 py-2 bg-blue-300 text-white text-3xl rounded-lg hover:bg-blue-500 transition"
        >
          Gallery
        </a>
      </div> */}

    </div>
  )
}

export default Session