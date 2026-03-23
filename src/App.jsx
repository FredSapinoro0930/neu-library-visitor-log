import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Login from './pages/Login'
import VisitorPage from './pages/VisitorPage'
import AdminPage from './pages/AdminPage'
import AdminRegister from './pages/AdminRegister'

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const q = query(collection(db, 'users'), where('email', '==', currentUser.email))
          const snap = await getDocs(q)
          if (!snap.empty) {
            setRole(snap.docs[0].data().role)
          } else {
            setRole('user')
          }
        } catch (err) {
          console.error(err)
          setRole('user')
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return (
    <div style={{
      display:'flex', justifyContent:'center', alignItems:'center',
      height:'100vh', background:'#1a5c1a', color:'white', fontSize:'18px'
    }}>
      Loading...
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : role === 'admin' ? <Navigate to="/admin" /> : <Login />} />
      <Route path="/visit" element={<VisitorPage />} />
      <Route path="/admin-register" element={user && role === 'admin' ? <AdminRegister /> : <Navigate to="/" />} />
      <Route path="/admin" element={user && role === 'admin' ? <AdminPage user={user} /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App