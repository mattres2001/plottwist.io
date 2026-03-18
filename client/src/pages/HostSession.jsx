import React, { useEffect } from "react"
import { assets } from "../assets/assets.js"
import { useNavigate } from "react-router-dom"

const HostSession = () => {
    const navigate = useNavigate()

    // REPLACE IN FUTURE
    useEffect(() => {
        const createSession = async () => {
        
        setTimeout(() => {
            // Random session code
            const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase()

            navigate(`/session/${sessionCode}`)
        }, 2000)
        }

        createSession()
    }, [navigate])

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