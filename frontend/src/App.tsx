import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Create from './pages/Create'
import Edit from './pages/Edit'
import ARLanding from './pages/ARLanding'
import Profile from './pages/Profile'
import Pricing from './pages/Pricing'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-canvas)' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute session={session}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute session={session}><Create /></ProtectedRoute>
        } />
        <Route path="/edit/:id" element={
          <ProtectedRoute session={session}><Edit /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute session={session}><Profile /></ProtectedRoute>
        } />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/ar/:slug" element={<ARLanding />} />
        <Route path="*" element={<Navigate to={session ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
