import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import CodeFlowApp from './CodeFlowApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<CodeFlowApp />} />
      </Routes>
    </BrowserRouter>
  )
}
