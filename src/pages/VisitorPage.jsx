import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.png'

function VisitorPage({ user }) {
  const navigate = useNavigate()
  const [program, setProgram] = useState('')
  const [college, setCollege] = useState('')
  const [reason, setReason] = useState('')
  const [isEmployee, setIsEmployee] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const checkBlocked = async () => {
      const q = query(collection(db, 'users'), where('email', '==', user.email))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data()
        if (userData.isBlocked) setIsBlocked(true)
        if (userData.name) setStudentName(userData.name)
        if (userData.program && !program) setProgram(userData.program)
        if (userData.college && !college) setCollege(userData.college)
      }
      setLoading(false)
    }
    checkBlocked()
  }, [user])

  // Auto logout countdown after visit is submitted
  useEffect(() => {
    if (!submitted) return
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted])

  const displayName = user.displayName || studentName

  const handleSubmit = async () => {
    if (!program || !college || !reason) {
      alert('Please fill in all fields.')
      return
    }
    try {
      await addDoc(collection(db, 'visits'), {
        userId: user.uid,
        name: displayName,
        email: user.email,
        program,
        college,
        reason,
        isEmployee,
        timestamp: new Date()
      })
      setSubmitted(true)
    } catch (error) {
      console.error(error)
      alert('Failed to log visit. Please try again.')
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const bgStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `url(${schoolBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    filter: 'blur(3px)',
    zIndex: -2
  }

  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: -1
  }

  const cardStyle = {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    borderTop: '5px solid #1a5c1a',
    zIndex: 1,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '16px',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px'
  }

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1a5c1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '8px',
    transition: 'background-color 0.3s, transform 0.2s'
  }

  const logoutButtonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s'
  }

  const divider = (
    <div style={{display:'flex', height:'1px', borderRadius:'2px', overflow:'hidden', margin:'12px auto 20px', width:'200px'}}>
      <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
      <div style={{flex:1, backgroundColor:'#fff'}}/>
      <div style={{flex:1, backgroundColor:'#c0392b'}}/>
    </div>
  )

  const handleCardHover = e => {
    e.currentTarget.style.transform = 'scale(1.02)'
    e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.6)'
  }

  const handleCardLeave = e => {
    e.currentTarget.style.transform = 'scale(1)'
    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'
  }

  const handleBtnHover = e => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.backgroundColor = '#144d14'
  }

  const handleBtnLeave = e => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.backgroundColor = '#1a5c1a'
  }

  const handleLogoutHover = e => {
    e.currentTarget.style.backgroundColor = '#f0f0f0'
    e.currentTarget.style.color = '#333'
  }

  const handleLogoutLeave = e => {
    e.currentTarget.style.backgroundColor = 'transparent'
    e.currentTarget.style.color = '#555'
  }

  const handleInputFocus = e => {
    e.currentTarget.style.borderColor = '#1a5c1a'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,92,26,0.1)'
  }

  const handleInputBlur = e => {
    e.currentTarget.style.borderColor = '#ddd'
    e.currentTarget.style.boxShadow = 'none'
  }

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#1a5c1a', color:'white', fontSize:'18px'}}>
      Loading...
    </div>
  )

  if (isBlocked) return (
    <div style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={bgStyle}/>
      <div style={overlay}/>
      <div style={{...cardStyle, textAlign:'center'}} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
        <img src={neuLogo} alt="NEU Logo" style={{width:'80px', marginBottom:'16px'}} />
        <h2 style={{color:'#c0392b', margin:'0 0 8px'}}>Access Denied</h2>
        <p style={{color:'#666', marginBottom:'24px'}}>You are not allowed to use the library at this time. Please contact the librarian for assistance.</p>
        <button style={logoutButtonStyle} onMouseEnter={handleLogoutHover} onMouseLeave={handleLogoutLeave} onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={bgStyle}/>
      <div style={overlay}/>
      <div style={{...cardStyle, textAlign:'center'}} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
        <img src={neuLogo} alt="NEU Logo" style={{width:'90px', marginBottom:'16px'}} />
        <h1 style={{color:'#1a5c1a', fontSize:'24px', margin:'0 0 8px'}}>Welcome to NEU Library!</h1>
        <p style={{fontSize:'16px', color:'#333', margin:'0 0 4px'}}>Hello, <strong>{displayName}</strong>!</p>
        <p style={{color:'#666', margin:'0 0 4px'}}>Program: <strong>{program}</strong></p>
        <p style={{color:'#666', margin:'0 0 16px'}}>Purpose: <strong>{reason}</strong></p>
        {divider}
        <div style={{background:'rgba(255,255,255,0.5)', borderRadius:'8px', padding:'12px', marginBottom:'16px'}}>
          <p style={{color:'#555', fontSize:'13px', margin:0}}>Visit logged successfully. Enjoy your time at the library!</p>
        </div>

        {/* Countdown */}
        <div style={{marginBottom:'16px'}}>
          <p style={{color:'#666', fontSize:'13px', margin:'0 0 8px'}}>
            Returning to login in <strong style={{color:'#1a5c1a', fontSize:'16px'}}>{countdown}</strong> seconds...
          </p>
          <div style={{backgroundColor:'#f0f0f0', borderRadius:'6px', height:'6px', overflow:'hidden'}}>
            <div style={{
              backgroundColor:'#1a5c1a',
              height:'6px',
              borderRadius:'6px',
              width:`${(countdown / 5) * 100}%`,
              transition:'width 1s linear'
            }}/>
          </div>
        </div>

        <button
          style={buttonStyle}
          onMouseEnter={handleBtnHover}
          onMouseLeave={handleBtnLeave}
          onClick={handleLogout}>
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={bgStyle}/>
      <div style={overlay}/>
      <div style={cardStyle} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
        <div style={{textAlign:'center', marginBottom:'24px'}}>
          <img src={neuLogo} alt="NEU Logo" style={{width:'70px', marginBottom:'12px'}} />
          <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'20px'}}>NEU Library Visitor Log</h2>
          <p style={{color:'#555', margin:0, fontSize:'14px'}}>Hello, <strong>{displayName}</strong>! Please fill in the form below.</p>
          {divider}
        </div>

        <label style={labelStyle}>Program</label>
        <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. BSIT, BSCS, BSED" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />

        <label style={labelStyle}>College</label>
        <input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. CICS, CBA, CEA" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />

        <label style={labelStyle}>Reason for Visit</label>
        <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur}>
          <option value="">Select a reason</option>
          <option value="Reading">Reading</option>
          <option value="Researching">Researching</option>
          <option value="Use of Computer">Use of Computer</option>
          <option value="Meeting">Meeting</option>
          <option value="Other">Other</option>
        </select>

        <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', cursor:'pointer'}}>
          <input type="checkbox" checked={isEmployee} onChange={e => setIsEmployee(e.target.checked)} style={{width:'16px', height:'16px', accentColor:'#1a5c1a'}} />
          <span style={{fontSize:'14px', color:'#333'}}>I am an employee (teacher/staff)</span>
        </label>

        <button style={buttonStyle} onMouseEnter={handleBtnHover} onMouseLeave={handleBtnLeave} onClick={handleSubmit}>
          Log My Visit
        </button>
        <button style={logoutButtonStyle} onMouseEnter={handleLogoutHover} onMouseLeave={handleLogoutLeave} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default VisitorPage