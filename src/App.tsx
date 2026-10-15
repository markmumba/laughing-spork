import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

const HomePage   = lazy(() => import('./pages/HomePage'))
const EssaysPage = lazy(() => import('./pages/EssaysPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const ResumePage  = lazy(() => import('./pages/ResumePage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/essays"     element={<EssaysPage />} />
          <Route path="/essays/:id" element={<ArticlePage />} />
          <Route path="/resume"     element={<ResumePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
