import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from "../assets/assets.js"
import api from '../api/axios.js'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'

const JoinSession = () => {
    const [sessionCode, setSessionCode] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { getToken } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data } = await api.post(
                '/api/session/join', 
                {code: sessionCode}, 
                { 
                    headers: { 
                        Authorization: `Bearer ${await getToken()}`
                    } 
                }
            )

            if (data.success) {
                navigate(`/session/${sessionCode}`)
            } else
                toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }


        // REPLACE IN FUTURE
        // setTimeout(() => {
        //   console.log('Joining session with code:', sessionCode || 'RANDOM')
        //   setLoading(false)

        //   navigate(`/session/${sessionCode || 'RANDOM'}`)
        // }, 2000)
    }

  return (
    <div className="relative h-screen w-screen overflow-hidden">

      <a
        onClick={() => navigate(-1)}
        className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200"
      >
        Go Back
      </a>

      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />

      {loading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-2xl font-semibold">Joining session...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-5">

        <form
          className="flex flex-col space-y-4 bg-white p-6 rounded-lg shadow-lg"
          onSubmit={handleSubmit}
        >

          <div>
            <label htmlFor="session_code" className="block mb-1 font-semibold">
              Session Code:
            </label>
            <input
              type="text"
              id="session_code"
              name="session_code"
              placeholder="empty=random"
              className="w-full px-3 py-2 border rounded"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="block mx-auto px-6 py-2 bg-blue-300 text-white rounded hover:bg-blue-500 transition"
          >
            Submit
          </button>

        </form>

      </div>
    </div>
  )
}

export default JoinSession