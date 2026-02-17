import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import Landing from './components/Landing';

function App() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis" element={<Wizard />} />
      </Routes>
    </div>
  )
}

export default App
