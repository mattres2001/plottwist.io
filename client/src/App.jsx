import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Route, Routes } from 'react-router-dom'

const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Login/>}>
          <Route index element={<MainMenu/>}/>
        </Route>
      </Routes>
    </>
  )
}

export default App
