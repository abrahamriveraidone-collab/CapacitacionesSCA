import { useState } from 'react'
import Gate        from './pages/Gate'
import Home        from './pages/Home'
import ModulePage  from './pages/Module'
import QuizPage    from './pages/Quiz'
import AdminLogin  from './pages/AdminLogin'
import Admin       from './pages/Admin'

export default function App() {
  const [screen, setScreen]   = useState('gate')
  const [user, setUser]       = useState(null)
  const [curMod, setCurMod]   = useState(null)
  const [curExam, setCurExam] = useState(null)

  function go(s) {
    setScreen(s)
    const titles = {
      gate:  'Scania — Malla de Capacitación de Almacenes',
      home:  'Capacitaciones · Scania',
      mod:   'Módulo · Scania',
      quiz:  'Examen · Scania',
      login: 'Administrador · Scania',
      admin: 'Panel Admin · Scania',
    }
    document.title = titles[s] || 'Scania — Malla de Capacitación de Almacenes'
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {screen === 'gate' && (
        <Gate
          onLogin={u => { setUser(u); go('home') }}
          onGoAdmin={() => go('login')}
        />
      )}
      {screen === 'home' && user && (
        <Home
          user={user}
          onLogout={() => { setUser(null); go('gate') }}
          onOpenMod={m => { setCurMod(m); go('mod') }}
          onGoAdmin={() => go('login')}
        />
      )}
      {screen === 'mod' && curMod && (
        <ModulePage
          mod={curMod}
          user={user}
          onBack={() => go('home')}
          onStartQuiz={e => { setCurExam(e); go('quiz') }}
          onGoAdmin={() => go('login')}
        />
      )}
      {screen === 'quiz' && (
        <QuizPage
          exam={curExam}
          user={user}
          mod={curMod}
          onBack={() => go('mod')}
        />
      )}
      {screen === 'login' && (
        <AdminLogin
          onLogin={() => go('admin')}
          onBack={() => go(user ? 'home' : 'gate')}
        />
      )}
      {screen === 'admin' && (
        <Admin
          onGoPlataforma={() => go(user ? 'home' : 'gate')}
          onLogout={() => { go('gate') }}
        />
      )}
    </div>
  )
}
