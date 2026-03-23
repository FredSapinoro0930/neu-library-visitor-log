import { auth, provider, db } from '../firebase'
import { signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.png'

function Login() {
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  const adminEmails = ['jcesperanza@neu.edu.ph', 'fredrickjohn.sapinoro@neu.edu.ph']

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatStudentId = (value) => {
    const digits = value.replace(/[^0-9]/g, '')
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `${digits.slice(0,2)}-${digits.slice(2)}`
    return `${digits.slice(0,2)}-${digits.slice(2,7)}-${digits.slice(7,10)}`
  }

  const handleStudentIdChange = (e) => {
    setStudentId(formatStudentId(e.target.value))
    setError('')
  }

  const handleStudentIdSubmit = async () => {
    if (!studentId || studentId.length < 12) {
      setError('Please enter a valid Student ID (e.g. 12-34567-890)')
      return
    }
    setLoading(true)
    try {
      const q = query(collection(db, 'users'), where('studentId', '==', studentId))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data()
        if (userData.isBlocked) {
          setError('Your access has been blocked. Please contact the librarian.')
          setLoading(false)
          return
        }
        navigate('/visit', { state: { studentId, userData, loginMethod: 'studentId' } })
      } else {
        navigate('/visit', { state: { studentId, loginMethod: 'studentId', isFirstTime: true } })
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleStudentIdSubmit()
  }

  const handleGoogleVisitorLogin = async () => {
    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      if (!user.email.endsWith('@neu.edu.ph')) {
        alert('Only @neu.edu.ph accounts are allowed.')
        await auth.signOut()
        setGoogleLoading(false)
        return
      }
      // Sign out immediately — visitors don't need Firebase Auth session
      await auth.signOut()

      const q = query(collection(db, 'users'), where('email', '==', user.email))
      const snapshot = await getDocs(q)
      const googleUser = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      }
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data()
        if (userData.isBlocked) {
          alert('Your access has been blocked. Please contact the librarian.')
          setGoogleLoading(false)
          return
        }
        navigate('/visit', { state: { googleUser, userData, loginMethod: 'google' } })
      } else {
        navigate('/visit', { state: { googleUser, loginMethod: 'google', isFirstTime: true } })
      }
    } catch (err) {
      console.error(err)
    }
    setGoogleLoading(false)
  }

  const handleAdminLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    // Check if admin email first before doing anything
    const isAdmin = adminEmails.includes(user.email)

    if (!user.email.endsWith('@neu.edu.ph') && !isAdmin) {
      alert('Only @neu.edu.ph accounts are allowed.')
      await auth.signOut()
      setShowAdminLogin(false)
      return
    }

    if (!isAdmin) {
      // Not an admin — sign out and show message, don't create any Firestore record
      await auth.signOut()
      setShowAdminLogin(false)
      alert('⚠️ Access Denied\n\nYour account does not have admin privileges.\n\nIf you believe this is a mistake, please contact the librarian.')
      return
    }

    // Only admins reach here
    const q = query(collection(db, 'users'), where('email', '==', user.email))
    const snap = await getDocs(q)

    if (!snap.empty) {
      const existingData = snap.docs[0].data()
      await updateDoc(doc(db, 'users', snap.docs[0].id), { role: 'admin' })
      const isFirstTime = !existingData.program && !existingData.college && !existingData.department
      setShowAdminLogin(false)
      window.location.href = isFirstTime ? '/admin-register' : '/admin'
    } else {
      // Brand new admin — create document
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        role: 'admin',
        isBlocked: false,
        createdAt: new Date()
      })
      setShowAdminLogin(false)
      window.location.href = '/admin-register'
    }
  } catch (err) {
    console.error(err)
    setShowAdminLogin(false)
  }
}

  const divider = (
    <div style={{display:'flex', height:'2px', overflow:'hidden', margin:'16px auto 24px', width:'200px'}}>
      <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
      <div style={{flex:1, backgroundColor:'#fff'}}/>
      <div style={{flex:1, backgroundColor:'#c0392b'}}/>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', boxSizing: 'border-box',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '40px 20px', overflowX: 'hidden'
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${schoolBg})`, backgroundSize: 'cover',
        backgroundPosition: 'center', filter: 'blur(3px)', zIndex: -2
      }}/>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)', zIndex: -1
      }}/>

      {/* Live Date/Time */}
      <div style={{
        position: 'fixed', top: '20px', right: '24px', zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px', padding: '10px 16px', textAlign: 'right'
      }}>
        <div style={{color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '1px', fontFamily: 'monospace'}}>
          {formatTime(now)}
        </div>
        <div style={{color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginTop: '2px'}}>
          {formatDate(now)}
        </div>
      </div>

      {/* Main Card */}
      <div
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow='0 25px 70px rgba(0,0,0,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.5)' }}
        style={{
          position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          padding: '48px 40px', width: '100%', maxWidth: '460px',
          textAlign: 'center', borderTop: '5px solid #1a5c1a',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>

        <img src={neuLogo} alt="NEU Logo" style={{width:'100px', height:'100px', marginBottom:'16px'}} />
        <h1 style={{color:'#1a5c1a', fontSize:'22px', fontWeight:'700', margin:'0 0 4px'}}>New Era University</h1>
        <h2 style={{color:'#333', fontSize:'15px', fontWeight:'500', margin:'0 0 4px'}}>Library Visitor Log System</h2>
        <p style={{color:'#1a5c1a', fontSize:'13px', fontWeight:'600', margin:'4px 0 0', letterSpacing:'0.3px'}}>Welcome to NEU Library!</p>
        {divider}

        {/* Student ID Input */}
        <p style={{color:'#555', fontSize:'14px', marginBottom:'12px', fontWeight:'500'}}>
          Enter your <strong>Student ID</strong> to check in
        </p>
        <input
          value={studentId}
          onChange={handleStudentIdChange}
          onKeyPress={handleKeyPress}
          placeholder="12-34567-890"
          maxLength={12}
          style={{
            width: '100%', padding: '16px', borderRadius: '10px',
            border: error ? '2px solid #c0392b' : '2px solid #ddd',
            fontSize: '22px', fontWeight: '600', boxSizing: 'border-box',
            marginBottom: '8px', outline: 'none',
            backgroundColor: 'rgba(255,255,255,0.9)',
            textAlign: 'center', letterSpacing: '3px',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={e => { e.currentTarget.style.borderColor='#1a5c1a'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,92,26,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor= error ? '#c0392b' : '#ddd'; e.currentTarget.style.boxShadow='none' }}
        />
        {error && <p style={{color:'#c0392b', fontSize:'13px', margin:'0 0 12px', textAlign:'left'}}>{error}</p>}
        <button
          onClick={handleStudentIdSubmit}
          disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
          style={{
            width: '100%', padding: '15px', backgroundColor: '#1a5c1a',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            marginBottom: '20px', transition: 'background-color 0.2s, transform 0.2s'
          }}>
          {loading ? 'Checking...' : 'Enter Library'}
        </button>

        {/* RFID Tap Area — UI only */}
        <div
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(26,92,26,0.6)'; e.currentTarget.style.backgroundColor='rgba(26,92,26,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(26,92,26,0.35)'; e.currentTarget.style.backgroundColor='rgba(26,92,26,0.04)' }}
          style={{
            border: '2px dashed rgba(26,92,26,0.35)',
            borderRadius: '14px', padding: '18px 16px', marginBottom: '20px',
            backgroundColor: 'rgba(26,92,26,0.04)', cursor: 'default',
            transition: 'border-color 0.3s, background-color 0.3s'
          }}>
          <style>{`
            @keyframes rfidPulse {
              0% { transform: scale(0.95); opacity: 0.6; }
              50% { transform: scale(1.05); opacity: 0.2; }
              100% { transform: scale(0.95); opacity: 0.6; }
            }
            @keyframes rfidGlow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(26,92,26,0.3); }
              50% { box-shadow: 0 0 0 10px rgba(26,92,26,0); }
            }
          `}</style>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            backgroundColor: 'rgba(26,92,26,0.1)',
            border: '2px solid rgba(26,92,26,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            animation: 'rfidPulse 2s ease-in-out infinite, rfidGlow 2s ease-in-out infinite'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a5c1a" strokeWidth="1.8">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
              <line x1="6" y1="15" x2="10" y2="15"/>
              <line x1="12" y1="15" x2="16" y2="15"/>
            </svg>
          </div>
          <p style={{color:'#1a5c1a', fontSize:'13px', fontWeight:'700', margin:'0 0 2px', letterSpacing:'0.5px'}}>
            Tap your ID card
          </p>
          <p style={{color:'#888', fontSize:'11px', margin:0}}>Place your ID card on the reader</p>
        </div>

        {/* OR Divider */}
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
          <div style={{flex:1, height:'1px', backgroundColor:'rgba(0,0,0,0.15)'}}/>
          <span style={{color:'#888', fontSize:'13px', fontWeight:'500'}}>or sign in with</span>
          <div style={{flex:1, height:'1px', backgroundColor:'rgba(0,0,0,0.15)'}}/>
        </div>

        {/* Google Visitor Login */}
        <button
          onClick={handleGoogleVisitorLogin}
          disabled={googleLoading}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor='#f0f0f0'; e.currentTarget.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor='white'; e.currentTarget.style.transform='translateY(0)' }}
          style={{
            width: '100%', padding: '13px', backgroundColor: 'white',
            color: '#333', border: '1.5px solid #ddd', borderRadius: '10px',
            fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', transition: 'all 0.2s', marginBottom: '4px'
          }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          {googleLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <p style={{color:'#999', fontSize:'11px', margin:'6px 0 0'}}>@neu.edu.ph accounts only</p>

        <p style={{color:'#999', fontSize:'11px', marginTop:'16px'}}>
          © {new Date().getFullYear()} New Era University · Library Services
        </p>
      </div>

      {/* Admin Button */}
      <button
        onClick={() => setShowAdminLogin(true)}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
        style={{
          position: 'fixed', bottom: '20px', right: '24px',
          padding: '8px 16px', backgroundColor: '#1a5c1a', color: 'white',
          border: '1px solid #144d14', borderRadius: '8px', fontSize: '12px',
          cursor: 'pointer', zIndex: 10, transition: 'all 0.2s'
        }}>
        Admin Login
      </button>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '40px',
            width: '100%', maxWidth: '380px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderTop: '5px solid #1a5c1a'
          }}>
            <img src={neuLogo} alt="NEU" style={{width:'70px', marginBottom:'12px'}} />
            <h2 style={{color:'#1a5c1a', margin:'0 0 8px', fontSize:'18px'}}>Admin Login</h2>
            <p style={{color:'#666', fontSize:'13px', marginBottom:'24px'}}>Sign in with your NEU Google account</p>
            <button
              onClick={handleAdminLogin}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
              style={{
                width: '100%', padding: '13px', backgroundColor: '#1a5c1a',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                marginBottom: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '10px', transition: 'all 0.2s'
              }}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
              </svg>
              Sign in with Google
            </button>
            <button
              onClick={() => setShowAdminLogin(false)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
              style={{
                width: '100%', padding: '11px', backgroundColor: 'transparent',
                color: '#666', border: '1px solid #ddd', borderRadius: '8px',
                fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s'
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login