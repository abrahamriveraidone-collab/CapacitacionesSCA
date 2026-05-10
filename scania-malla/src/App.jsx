import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Gate        from './pages/Gate'
import Home        from './pages/Home'
import ModulePage  from './pages/Module'
import QuizPage    from './pages/Quiz'
import AdminLogin  from './pages/AdminLogin'
import Admin       from './pages/Admin'

export default function App() {
  const [user, setUser]         = useState(null)   // almacenero activo
  const [curMod, setCurMod]     = useState(null)   // módulo seleccionado
  const [curExam, setCurExam]   = useState(null)   // examen seleccionado

  return (
    <BrowserRouter>
      <Routes>
        {/* Plataforma almacenero */}
        <Route path="/" element={
          user
            ? <Home user={user} onLogout={() => setUser(null)} onOpenMod={m => { setCurMod(m); window.location.href = '/modulo'; }} />
            : <Gate onLogin={setUser} />
        } />
        <Route path="/modulo" element={
          curMod
            ? <ModulePage mod={curMod} user={user} onBack={() => window.location.href = '/'} onStartQuiz={e => { setCurExam(e); window.location.href = '/quiz'; }} />
            : <Navigate to="/" />
        } />
        <Route path="/quiz" element={
          curExam && user
            ? <QuizPage exam={curExam} user={user} mod={curMod} onBack={() => window.location.href = '/modulo'} />
            : <Navigate to="/" />
        } />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*"     element={<Admin />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
