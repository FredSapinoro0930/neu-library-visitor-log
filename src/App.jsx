import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Login from './pages/Login'
import VisitorPage from './pages/VisitorPage'
import AdminPage from './pages/AdminPage'

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          setRole(userDoc.data().role)
        } else {
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

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Login /> : role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/visitor" />} />
      <Route path="/visitor" element={user && role === 'user' ? <VisitorPage user={user} /> : <Navigate to="/" />} />
      <Route path="/admin" element={user && role === 'admin' ? <AdminPage user={user} /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App