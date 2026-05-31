// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Results from './pages/Results.jsx'
import Nav from './components/Nav.jsx'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
    </div>
  )
}
