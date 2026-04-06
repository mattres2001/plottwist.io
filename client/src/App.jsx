import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import MainMenu from './pages/MainMenu'
import Gallery from './pages/Gallery'
import HostSession from './pages/HostSession'
import JoinSession from './pages/JoinSession'
import Session from './pages/Session'
import ExampleDocumentWriter from './pages/ExampleDocumentWriter'
import Layout from './pages/Layout'
import { useUser } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'

const App = () => {
    const { user } = useUser()

    console.log("User:", user)

    return (
        <>
            <Toaster/>
            <Routes>
                <Route path='/' element={ !user ? <Login/> : <Layout/>}>
                    <Route index element={<MainMenu/>}/>
                    <Route path='/gallery' element={<Gallery/>}/>
                    <Route path='/host_session' element={<HostSession/>}/>
                    <Route path='/join_session' element={<JoinSession/>}/>
                    <Route path="/session/:sessionCode" element={<Session/>}/>
                    <Route path="/doc" element={<ExampleDocumentWriter/>}/>
                    {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
                </Route>
            </Routes>
        
        </>
    )
}

export default App
