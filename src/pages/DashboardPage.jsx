import { motion } from 'framer-motion'
import { LogOut, TrendingUp, Wallet, BarChart2, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useState } from 'react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader'

  const handleLogout = async () => {
    setLoggingOut(true)
    const { error } = await signOut()
    setLoggingOut(false)
    if (error) {
      toast.error('Logout mein error aaya!')
    } else {
      toast.success('Logout ho gaye! Milte hain phir 👋')
      navigate('/login')
    }
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-start px-4 py-6">
      <motion.div
        className="w-full"
        style={{ maxWidth: 430 }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <TrendingUp size={18} color="#fff" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-white">Trade</span>
              <span style={{ color: '#3B82F6' }}>Boost</span>
              <span className="text-white">.AI</span>
            </span>
          </div>
          <motion.button
            onClick={handleLogout}
            disabled={loggingOut}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#EF4444',
              cursor: loggingOut ? 'not-allowed' : 'pointer',
            }}
          >
            {loggingOut ? <LoadingSpinner size={14} color="#EF4444" /> : <LogOut size={13} />}
            Logout
          </motion.button>
        </div>

        {/* Welcome banner */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-5"
          style={{ border: '1px solid rgba(59,130,246,0.2)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#9CA3AF' }}>Namaste 👋</p>
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, <span style={{ color: '#3B82F6' }}>{displayName}!</span> 🚀
          </h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>{user?.email}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard icon={Wallet}   label="Virtual Balance" value="₹1,00,000"    color="#10B981" />
          <StatCard icon={BarChart2} label="Trades"          value="0 this week"  color="#3B82F6" />
        </motion.div>

        {/* Coming soon card */}
        <motion.div
          className="glass-card rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <BookOpen size={28} color="#3B82F6" />
            </div>
          </div>
          <h2 className="text-base font-bold text-white mb-2">Home screen coming soon... 🛠️</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Humari team full dashboard bana rahi hai. Thoda sabr karo — bahut kuch exciting aane wala hai!
          </p>

          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
            <p className="text-xs text-left" style={{ color: '#10B981' }}>
              Authentication system ready hai! ✅ Dashboard aur virtual trading coming soon.
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
          © 2025 TradeBoost.AI · Virtual trading for learning only
        </p>
      </motion.div>
    </div>
  )
}
