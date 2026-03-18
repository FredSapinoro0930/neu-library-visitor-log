import { auth, provider, db } from '../firebase'
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.jpg'

function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('google')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [program, setProgram] = useState('')
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState('auto')

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setContentHeight(el.scrollHeight + 'px')
    })
    observer.observe(el)
    setContentHeight(el.scrollHeight + 'px')
    return () => observer.disconnect()
  }, [tab, isRegistering])

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          role: 'user',
          isBlocked: false,
          createdAt: new Date()
        })
        navigate('/visitor')
      } else {
        const data = userDoc.data()
        if (data.isBlocked) { alert('Your account has been blocked.'); return }
        data.role === 'admin' ? navigate('/choice') : navigate('/visitor')
      }
    } catch (error) {
      console.error(error)
      alert('Login failed. Please try again.')
    }
  }

  const handleStudentLogin = async () => {
    if (!loginInput || !password) { alert('Please fill in all fields.'); return }
    setLoading(true)
    try {
      let emailToUse = loginInput
      if (!loginInput.includes('@')) {
        const q = query(collection(db, 'users'), where('studentId', '==', loginInput))
        const snapshot = await getDocs(q)
        if (snapshot.empty) {
          alert('Student ID not found. Please check and try again.')
          setLoading(false)
          return
        }
        emailToUse = snapshot.docs[0].data().email
      }
      const result = await signInWithEmailAndPassword(auth, emailToUse, password)
      const userRef = doc(db, 'users', result.user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const data = userDoc.data()
        if (data.isBlocked) { alert('Your account has been blocked.'); setLoading(false); return }
        data.role === 'admin' ? navigate('/choice') : navigate('/visitor')
      }
    } catch (error) {
      console.error(error)
      alert('Invalid credentials. Please check and try again.')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!name || !studentId || !regEmail || !password || !confirmPassword || !program || !college) {
      alert('Please fill in all fields.')
      return
    }
    if (!regEmail.includes('@')) {
      alert('Please enter a valid email address.')
      return
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const q = query(collection(db, 'users'), where('studentId', '==', studentId))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        alert('Student ID already registered.')
        setLoading(false)
        return
      }
      const result = await createUserWithEmailAndPassword(auth, regEmail, password)
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        studentId,
        email: regEmail,
        program,
        college,
        role: 'user',
        isBlocked: false,
        createdAt: new Date()
      })
      navigate('/visitor')
    } catch (error) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered.')
      } else {
        alert('Registration failed. Please try again.')
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '12px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const btnStyle = {
    width: '100%',
    padding: '13px',
    backgroundColor: '#1a5c1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'background-color 0.2s, transform 0.2s'
  }

  const handleBtnHover = e => {
    e.currentTarget.style.backgroundColor = '#144d14'
    e.currentTarget.style.transform = 'translateY(-1px)'
  }

  const handleBtnLeave = e => {
    e.currentTarget.style.backgroundColor = '#1a5c1a'
    e.currentTarget.style.transform = 'translateY(0)'
  }

  const handleInputFocus = e => {
    e.currentTarget.style.borderColor = '#1a5c1a'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,92,26,0.1)'
  }

  const handleInputBlur = e => {
    e.currentTarget.style.borderColor = '#ddd'
    e.currentTarget.style.boxShadow = 'none'
  }

  const divider = (
    <div style={{display:'flex', height:'4px', borderRadius:'2px', overflow:'hidden', margin:'12px auto 20px', width:'80px'}}>
      <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
      <div style={{flex:1, backgroundColor:'#fff'}}/>
      <div style={{flex:1, backgroundColor:'#c0392b'}}/>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      overflowX: 'hidden'
    }}>

      {/* Fixed background */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${schoolBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(2px)',
        zIndex: -2
      }}/>

      {/* Fixed overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: -1
      }}/>

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
        borderTop: '5px solid #1a5c1a',
        overflow: 'hidden'
      }}>

        <img src={neuLogo} alt="NEU Logo" style={{width:'90px', height:'90px', marginBottom:'12px'}} />
        <h1 style={{color:'#1a5c1a', fontSize:'20px', fontWeight:'700', margin:'0 0 4px'}}>New Era University</h1>
        <h2 style={{color:'#333', fontSize:'14px', fontWeight:'500', margin:'0 0 4px'}}>Library Visitor Log System</h2>
        {divider}

        {/* Tabs */}
        <div style={{display:'flex', backgroundColor:'#f0f0f0', borderRadius:'8px', padding:'4px', marginBottom:'20px'}}>
          <button onClick={() => { setTab('google'); setIsRegistering(false) }} style={{
            flex:1, padding:'8px', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
            backgroundColor: tab === 'google' ? 'white' : 'transparent',
            color: tab === 'google' ? '#1a5c1a' : '#666',
            boxShadow: tab === 'google' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>Google Login</button>
          <button onClick={() => { setTab('student'); setIsRegistering(false) }} style={{
            flex:1, padding:'8px', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
            backgroundColor: tab === 'student' ? 'white' : 'transparent',
            color: tab === 'student' ? '#1a5c1a' : '#666',
            boxShadow: tab === 'student' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>Student Login</button>
        </div>

        {/* Animated height wrapper */}
        <div style={{
          height: contentHeight,
          overflow: 'hidden',
          transition: 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div ref={contentRef}>

            {/* Google Login Tab */}
            {tab === 'google' && (
              <div className="fade-in">
                <p style={{color:'#666', fontSize:'13px', marginBottom:'20px'}}>
                  Sign in with your institutional Google account
                </p>
                <button
                  onClick={handleGoogleLogin}
                  onMouseEnter={handleBtnHover}
                  onMouseLeave={handleBtnLeave}
                  style={{...btnStyle, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            )}

            {/* Student Login Tab */}
            {tab === 'student' && !isRegistering && (
              <div className="fade-in">
               <p style={{color:'#666', fontSize:'13px', marginBottom:'16px', textAlign:'left'}}>
  Sign in using your <strong>Student ID</strong> or <strong>institutional email</strong>
</p>
<div style={{backgroundColor:'#fff8e1', border:'1px solid #ffe082', borderRadius:'8px', padding:'10px 12px', marginBottom:'16px', textAlign:'left'}}>
  <p style={{color:'#856404', fontSize:'12px', margin:0}}>
    Note: This is for manually registered accounts only. If you signed in with Google before, please use the Google Login tab.
  </p>
</div>
                <input
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="Student ID or Email"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                <button
                  onClick={handleStudentLogin}
                  onMouseEnter={handleBtnHover}
                  onMouseLeave={handleBtnLeave}
                  style={btnStyle}
                  disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button
                  onClick={() => setIsRegistering(true)}
                  style={{
                    width:'100%', padding:'11px', backgroundColor:'transparent',
                    color:'#1a5c1a', border:'1px solid #1a5c1a', borderRadius:'8px',
                    fontSize:'14px', fontWeight:'600', cursor:'pointer', transition:'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.color='white' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.color='#1a5c1a' }}>
                  Register New Account
                </button>
              </div>
            )}

            {/* Register Form */}
            {tab === 'student' && isRegistering && (
              <div className="fade-in">
                <h3 style={{color:'#1a5c1a', margin:'0 0 16px', fontSize:'16px', textAlign:'left'}}>Create Account</h3>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Student ID (e.g. 2021-12345)" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Institutional Email (e.g. 2021-12345@neu.edu.ph)" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={program} onChange={e => setProgram(e.target.value)} placeholder="Program (e.g. BSIT)" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={college} onChange={e => setCollege(e.target.value)} placeholder="College (e.g. CICS)" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" type="password" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" type="password" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                <button
                  onClick={handleRegister}
                  onMouseEnter={handleBtnHover}
                  onMouseLeave={handleBtnLeave}
                  style={btnStyle}
                  disabled={loading}>
                  {loading ? 'Registering...' : 'Create Account'}
                </button>
                <button
                  onClick={() => setIsRegistering(false)}
                  style={{
                    width:'100%', padding:'11px', backgroundColor:'transparent',
                    color:'#666', border:'1px solid #ccc', borderRadius:'8px',
                    fontSize:'14px', cursor:'pointer', transition:'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                  Back to Login
                </button>
              </div>
            )}

          </div>
        </div>

        <p style={{color:'#999', fontSize:'11px', marginTop:'16px'}}>
          © {new Date().getFullYear()} New Era University · Library Services
        </p>
      </div>
    </div>
  )
}

export default Login