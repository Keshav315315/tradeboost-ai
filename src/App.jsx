import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/AuthGuard'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import TradePage from './pages/TradePage'
import SimulatorPage from './pages/SimulatorPage'
import AIMentorPage from './pages/AIMentorPage'
import PortfolioPage from './pages/PortfolioPage'
import LearnPage from './pages/LearnPage'
import LessonPage from './pages/LessonPage'
import ChartPage from './pages/ChartPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider kept for LoginPage / SignupPage (signIn / signUp helpers) */}
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid #E8F5E9',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#4CAF50', secondary: '#FFFFFF' } },
            error:   { iconTheme: { primary: '#E53935', secondary: '#FFFFFF' } },
          }}
        />

        <Routes>
          {/* Root → home */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Public routes */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected routes — AuthGuard reads session directly from Supabase storage */}
          <Route path="/home"      element={<AuthGuard><HomePage /></AuthGuard>} />
          <Route path="/trade"     element={<AuthGuard><TradePage /></AuthGuard>} />
          <Route path="/simulator" element={<AuthGuard><SimulatorPage /></AuthGuard>} />
          <Route path="/ai-mentor"  element={<AuthGuard><AIMentorPage /></AuthGuard>} />
          <Route path="/portfolio"  element={<AuthGuard><PortfolioPage /></AuthGuard>} />
          <Route path="/learn"      element={<AuthGuard><LearnPage /></AuthGuard>} />
          <Route path="/learn/:sectionId" element={<AuthGuard><LessonPage /></AuthGuard>} />
          <Route path="/chart/:symbol"   element={<AuthGuard><ChartPage /></AuthGuard>} />
          <Route path="/profile"         element={<AuthGuard><ProfilePage /></AuthGuard>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
