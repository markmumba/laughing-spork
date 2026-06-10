import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Preloader from './components/Preloader'
import './App.css'

const HomePage   = lazy(() => import('./pages/HomePage'))
const EssaysPage = lazy(() => import('./pages/EssaysPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const ResumePage  = lazy(() => import('./pages/ResumePage'))

function App() {
  const [preloaderDone, setPreloaderDone] = useState(() => {
    if (window.location.pathname !== '/') return true
    return sessionStorage.getItem('preloader-done') === '1'
  })

  const handlePreloaderDone = () => {
    sessionStorage.setItem('preloader-done', '1')
    setPreloaderDone(true)
  }

  return (
    <>
      {!preloaderDone && <Preloader onDone={handlePreloaderDone} />}
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
            <Route
              path="/"
              element={preloaderDone
                ? <HomePage />
                : <div style={{ minHeight: '100vh', background: '#000' }} />}
            />
            <Route path="/essays"     element={<EssaysPage />} />
            <Route path="/essays/:id" element={<ArticlePage />} />
            <Route path="/resume"     element={<ResumePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  )
}

export default App
