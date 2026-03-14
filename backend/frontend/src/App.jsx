import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import Landing from './components/Landing';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatBox from './components/ChatBox';

import SoilCheck from './components/SoilCheck';
import CropAI from './components/CropAI';
import Market from './components/Market';
import { Community } from './components/NavShells';
import MyCrops from './components/MyCrops';
import Profile from './components/Profile';
import AddCrop from './components/forms/AddCrop';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import LanguageSelection from './components/LanguageSelection';

// Auth guard: redirects to /login if no authenticated Firebase user
function RequireAuth({ children }) {
  // const { currentUser } = useAuth();
  // if (!currentUser || !currentUser.emailVerified) {
  //   return <Navigate to="/login" replace />;
  // }
  return children;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <div className="w-[390px] h-[844px] bg-[#0F1A14] rounded-[40px] border-8 border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/language" element={<RequireAuth><LanguageSelection /></RequireAuth>} />

        {/* Protected Routes */}
        <Route path="/home" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/analysis" element={<RequireAuth><Wizard /></RequireAuth>} />
        <Route path="/landing" element={<RequireAuth><Landing /></RequireAuth>} />
        <Route path="/soil-check" element={<RequireAuth><SoilCheck /></RequireAuth>} />
        <Route path="/crop-ai" element={<RequireAuth><CropAI /></RequireAuth>} />
        <Route path="/market" element={<RequireAuth><Market /></RequireAuth>} />
        <Route path="/records" element={<RequireAuth><MyCrops /></RequireAuth>} />
        <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/add-crop" element={<RequireAuth><AddCrop /></RequireAuth>} />

        {/* Default redirect based on verified auth state */}
        <Route path="/" element={
          (currentUser && currentUser.emailVerified)
            ? <Navigate to="/home" replace />
            : <Navigate to="/login" replace />
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBox />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <div className="min-h-screen font-sans bg-gray-950 flex items-center justify-center p-4">
          <AppRoutes />
        </div>
      </LanguageProvider>
    </UserProvider>
  );
}
