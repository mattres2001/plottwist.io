import React, { useEffect } from "react"
import { assets } from "../assets/assets.js"
import { useNavigate } from "react-router-dom"
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios.js'
import toast from 'react-hot-toast'
import { store } from '../store/store.js'
import { socket } from "../socket";

const HostSession = () => {
    const navigate = useNavigate()
    const { getToken } = useAuth()
    const { user } = useUser()
    const setSession = store((state) => state.setSession)

    useEffect(() => {
        const start = async () => {
            try {
                const { data } = await api.post(
                    '/api/session/start', 
                    {}, 
                    { 
                        headers: { 
                            Authorization: `Bearer ${await getToken()}`
                        } 
                    }
                )

                if (data.success) {
                    const newSession = data.newSession
                    setSession(newSession)

                    navigate(`/session/${newSession.code}`)
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }

        // ⚠️ wait until user exists
        if (user) {
            start()
        }
    }, [user])

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl">Creating session...</p>
            </div>
        </div>
    )
}

export default HostSession