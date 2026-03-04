import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import MainMenu from './pages/MainMenu'
import Gallery from './pages/Gallery'

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Login/>}>
          <Route path='gallery' element={<Gallery/>}/>
        </Route>
      </Routes>
      
    </>
  )
}

export default App
