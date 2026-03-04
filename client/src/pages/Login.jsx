import React from 'react'
import { assets } from '../assets/assets.js'
import { SignIn } from '@clerk/clerk-react'

const Login = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      
      {/* Background Image */}
      <img
        src={assets.bg_image_login}
        alt="Login background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Clerk Sign In */}
      <div className="mt-15 relative z-10 flex h-full items-center justify-center">
        <SignIn />
      </div>

    </div>
  )
}

export default Login
