import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import MainMenu from './pages/MainMenu'
import Gallery from './pages/Gallery'
import HostSession from './pages/HostSession'
import JoinSession from './pages/JoinSession'
import Session from './pages/Session'
import ExampleDocumentWriter from './pages/ExampleDocumentWriter'
import Layout from './pages/Layout'
import UserProfileSidebar from './components/UserProfileSidebar'
import { useUser } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'

const HomeWithProfile = () => {
  return (
    <>
      <UserProfileSidebar />
      <MainMenu />
    </>
  )
}

const App = () => {
  const { user } = useUser()

  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={!user ? <Login /> : <Layout />}>
          <Route index element={<HomeWithProfile />} />
          <Route path='/gallery' element={<Gallery />} />
          <Route path='/host_session' element={<HostSession />} />
          <Route path='/join_session' element={<JoinSession />} />
          <Route path='/session/:sessionCode' element={<Session />} />
          <Route path='/doc' element={<ExampleDocumentWriter />} />
        </Route>
      </Routes>
    </>
  )
}

export default App