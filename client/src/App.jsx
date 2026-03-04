import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Route, Routes, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import MainMenu from './pages/MainMenu'
import Gallery from './pages/Gallery'
import HostSession from './pages/HostSession'
import JoinSession from './pages/JoinSession'
import Session from './pages/Session'

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<MainMenu/>}/>
        <Route path='/gallery' element={<Gallery/>}/>
        <Route path='/host_session' element={<HostSession/>}/>
        <Route path='/join_session' element={<JoinSession/>}/>
        <Route path="/session/:sessionCode" element={<Session/>}/>
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </>
  )
}

export default App
