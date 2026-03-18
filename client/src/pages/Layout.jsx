import React from 'react'
import { Outlet } from 'react-router-dom'
import { assets } from '../assets/assets'

const Layout = () => {
    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <img
                src={assets.bg_image_login}
                className="absolute inset-0 h-full w-full object-cover"
                alt="background"
            />
            <Outlet/>
        </div>
    )
}

export default Layout
