import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { useNavigate, useLocation } from 'react-router-dom'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.png'

function VisitorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { studentId, userData, googleUser, loginMethod, isFirstTime } = location.state || {}

  const isGoogleLogin = loginMethod === 'google'
  const isReturning = !!userData && !isFirstTime

  const [step, setStep] = useState(() => {
    if (isReturning) return 'reason'
    if (isGoogleLogin) return 'register_google'
    return 'register_student'
  })

  const [name, setName] = useState(userData?.name || googleUser?.displayName || '')
  const [program, setProgram] = useState(userData?.program || '')
  const [college, setCollege] = useState(userData?.college || '')
  const [neuEmail, setNeuEmail] = useState(userData?.email || googleUser?.email || '')
  const [regStudentId, setRegStudentId] = useState(userData?.studentId || studentId || '')
  const [isEmployee, setIsEmployee] = useState(userData?.isEmployee || false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [loading, setLoading] = useState(false)
  const [profilePic, setProfilePic] = useState(googleUser?.photoURL || userData?.photoURL || null)

  const reasons = [
    { id: 'Reading', label: 'Reading', icon: '📖', color: '#1a5c1a', bg: '#e8f5e9' },
    { id: 'Researching', label: 'Researching', icon: '🔬', color: '#1a73e8', bg: '#e8f0fe' },
    { id: 'Use of Computer', label: 'Use of Computer', icon: '💻', color: '#c8a000', bg: '#fffde7' },
    { id: 'Internet Access', label: 'Internet Access', icon: '🌐', color: '#0097a7', bg: '#e0f7fa' },
    { id: 'Meeting', label: 'Meeting', icon: '👥', color: '#c0392b', bg: '#fce8e6' },
    { id: 'Other', label: 'Other', icon: '📝', color: '#6f42c1', bg: '#f3e8fd' },
  ]

  useEffect(() => {
    if (!studentId && !googleUser) { navigate('/'); return }
  }, [])

  useEffect(() => {
    if (!submitted) return
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); navigate('/'); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted])

  const handleRegisterStudentContinue = async () => {
    if (!name || !program || !college || !neuEmail) {
      alert('Please fill in all fields.')
      return
    }
    if (!neuEmail.endsWith('@neu.edu.ph')) {
      alert('Please enter a valid NEU email address (@neu.edu.ph)')
      return
    }
    // Try to fetch profile picture from existing Google account with same email
    try {
      const q = query(collection(db, 'users'), where('email', '==', neuEmail))
      const snap = await getDocs(q)
      if (!snap.empty && snap.docs[0].data().photoURL) {
        setProfilePic(snap.docs[0].data().photoURL)
      }
    } catch (e) { console.error(e) }
    setStep('reason')
  }

  const handleRegisterGoogleContinue = () => {
    if (!regStudentId || !program || !college) {
      alert('Please fill in all fields.')
      return
    }
    setStep('reason')
  }

  const handleSubmit = async () => {
    if (!reason) { alert('Please select a reason for your visit.'); return }
    setLoading(true)
    try {
      const finalName = name || userData?.name || googleUser?.displayName
      const finalProgram = program || userData?.program
      const finalCollege = college || userData?.college
      const finalEmail = neuEmail || userData?.email || googleUser?.email
      const finalStudentId = regStudentId || studentId || userData?.studentId || ''

      if (!isReturning) {
        await addDoc(collection(db, 'users'), {
          studentId: finalStudentId,
          name: finalName,
          email: finalEmail,
          program: finalProgram,
          college: finalCollege,
          role: 'user',
          isBlocked: false,
          isEmployee,
          photoURL: profilePic || null,
          createdAt: new Date()
        })
      }

      await addDoc(collection(db, 'visits'), {
        studentId: finalStudentId,
        name: finalName,
        email: finalEmail,
        program: finalProgram,
        college: finalCollege,
        reason,
        isEmployee,
        timestamp: new Date()
      })

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Failed to log visit. Please try again.')
    }
    setLoading(false)
  }

  const displayName = name || userData?.name || googleUser?.displayName
  const displayProgram = program || userData?.program
  const displayCollege = college || userData?.college
  const displayEmail = neuEmail || userData?.email || googleUser?.email
  const displayStudentId = regStudentId || studentId || userData?.studentId

  const bgStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `url(${schoolBg})`, backgroundSize: 'cover',
    backgroundPosition: 'center', filter: 'blur(3px)', zIndex: -2
  }
  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', zIndex: -1
  }
  const cardStyle = {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    padding: '40px',
    width: '100%',
    maxWidth: '540px',
    borderTop: '5px solid #1a5c1a',
    zIndex: 1,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  }
  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
    marginBottom: '16px', outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }
  const divider = (
    <div style={{display:'flex', height:'2px', overflow:'hidden', margin:'12px auto 20px', width:'200px'}}>
      <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
      <div style={{flex:1, backgroundColor:'#fff'}}/>
      <div style={{flex:1, backgroundColor:'#c0392b'}}/>
    </div>
  )
  const handleCardHover = e => { e.currentTarget.style.transform='scale(1.01)'; e.currentTarget.style.boxShadow='0 25px 70px rgba(0,0,0,0.6)' }
  const handleCardLeave = e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.5)' }
  const handleInputFocus = e => { e.currentTarget.style.borderColor='#1a5c1a'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,92,26,0.1)' }
  const handleInputBlur = e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.boxShadow='none' }

  const Avatar = ({ size = 80, fontSize = 28 }) => profilePic ? (
    <img src={profilePic} alt="Profile" style={{width:`${size}px`, height:`${size}px`, borderRadius:'50%', objectFit:'cover', border:'3px solid #1a5c1a', marginBottom:'12px'}} />
  ) : (
    <div style={{width:`${size}px`, height:`${size}px`, borderRadius:'50%', backgroundColor:'#1a5c1a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'3px solid #144d14'}}>
      <span style={{color:'white', fontSize:`${fontSize}px`, fontWeight:'700'}}>{displayName?.charAt(0)?.toUpperCase() || '?'}</span>
    </div>
  )

  // Welcome screen
  if (submitted) return (
    <div style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={bgStyle}/><div style={overlay}/>
      <div style={{...cardStyle, textAlign:'center'}} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
        <Avatar size={90} fontSize={32} />
        <h1 style={{color:'#1a5c1a', fontSize:'26px', margin:'0 0 8px', fontWeight:'800'}}>Welcome to NEU Library!</h1>
        <p style={{fontSize:'17px', color:'#333', margin:'0 0 4px'}}>Hello, <strong>{displayName}</strong>!</p>
        <p style={{color:'#666', margin:'0 0 2px', fontSize:'13px'}}>📧 {displayEmail}</p>
        {displayStudentId && <p style={{color:'#666', margin:'0 0 4px', fontSize:'13px'}}>🪪 {displayStudentId}</p>}
        <p style={{color:'#666', margin:'0 0 4px', fontSize:'14px'}}>Program: <strong>{displayProgram}</strong></p>
        <p style={{color:'#666', margin:'0 0 16px', fontSize:'14px'}}>Purpose: <strong>{reason}</strong></p>
        {divider}
        <div style={{background:'rgba(255,255,255,0.5)', borderRadius:'8px', padding:'12px', marginBottom:'16px'}}>
          <p style={{color:'#555', fontSize:'13px', margin:0}}>Visit logged successfully. Enjoy your time at the library!</p>
        </div>
        <div style={{marginBottom:'16px'}}>
          <p style={{color:'#666', fontSize:'13px', margin:'0 0 8px'}}>
            Returning to home in <strong style={{color:'#1a5c1a', fontSize:'16px'}}>{countdown}</strong> seconds...
          </p>
          <div style={{backgroundColor:'#f0f0f0', borderRadius:'6px', height:'6px', overflow:'hidden'}}>
            <div style={{backgroundColor:'#1a5c1a', height:'6px', borderRadius:'6px', width:`${(countdown/5)*100}%`, transition:'width 1s linear'}}/>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
          style={{width:'100%', padding:'14px', backgroundColor:'#1a5c1a', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', transition:'all 0.2s'}}>
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div style={{position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={bgStyle}/><div style={overlay}/>
      <div style={cardStyle} onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'20px'}}>
          <img src={neuLogo} alt="NEU Logo" style={{width:'60px', marginBottom:'10px'}} />
          <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'20px', fontWeight:'700'}}>NEU Library Visitor Log</h2>
          {displayStudentId && <p style={{color:'#888', margin:0, fontSize:'13px'}}>Student ID: <strong style={{color:'#1a5c1a'}}>{displayStudentId}</strong></p>}
          {divider}
        </div>

        {/* Step 1a — First time via Student ID */}
        {step === 'register_student' && (
          <div className="fade-in">
            <p style={{color:'#1a5c1a', fontWeight:'700', fontSize:'15px', marginBottom:'16px', textAlign:'center'}}>
              Welcome! Please tell us about yourself.
            </p>
            <label style={labelStyle}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Juan Dela Cruz" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={labelStyle}>NEU Email Address</label>
            <input value={neuEmail} onChange={e => setNeuEmail(e.target.value)} placeholder="e.g. 2021-12345@neu.edu.ph" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={labelStyle}>Program</label>
            <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. BSIT, BSCS, BSED" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={labelStyle}>College</label>
            <input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. CICS, CBA, CEA" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', cursor:'pointer'}}>
              <input type="checkbox" checked={isEmployee} onChange={e => setIsEmployee(e.target.checked)} style={{width:'16px', height:'16px', accentColor:'#1a5c1a'}} />
              <span style={{fontSize:'14px', color:'#333'}}>I am an employee (teacher/staff)</span>
            </label>
            <button
              onClick={handleRegisterStudentContinue}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
              style={{width:'100%', padding:'14px', backgroundColor:'#1a5c1a', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginBottom:'8px', transition:'all 0.2s'}}>
              Continue
            </button>
            <button onClick={() => navigate('/')}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
              style={{width:'100%', padding:'12px', backgroundColor:'transparent', color:'#666', border:'1px solid #ccc', borderRadius:'8px', fontSize:'14px', cursor:'pointer', transition:'all 0.2s'}}>
              Back
            </button>
          </div>
        )}

        {/* Step 1b — First time via Google */}
        {step === 'register_google' && (
          <div className="fade-in">
            {profilePic && (
              <div style={{textAlign:'center', marginBottom:'16px'}}>
                <img src={profilePic} alt="Profile" style={{width:'72px', height:'72px', borderRadius:'50%', objectFit:'cover', border:'3px solid #1a5c1a'}} />
                <p style={{color:'#1a5c1a', fontWeight:'700', fontSize:'15px', margin:'8px 0 0'}}>{googleUser?.displayName}</p>
                <p style={{color:'#888', fontSize:'13px', margin:'2px 0 0'}}>{googleUser?.email}</p>
              </div>
            )}
            <p style={{color:'#1a5c1a', fontWeight:'700', fontSize:'15px', marginBottom:'16px', textAlign:'center'}}>
              Welcome! Just a few more details.
            </p>
            <label style={labelStyle}>Student ID</label>
            <input value={regStudentId} onChange={e => setRegStudentId(e.target.value)} placeholder="12-34567-890" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={labelStyle}>Program</label>
            <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. BSIT, BSCS, BSED" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={labelStyle}>College</label>
            <input value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. CICS, CBA, CEA" style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
            <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', cursor:'pointer'}}>
              <input type="checkbox" checked={isEmployee} onChange={e => setIsEmployee(e.target.checked)} style={{width:'16px', height:'16px', accentColor:'#1a5c1a'}} />
              <span style={{fontSize:'14px', color:'#333'}}>I am an employee (teacher/staff)</span>
            </label>
            <button
              onClick={handleRegisterGoogleContinue}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
              style={{width:'100%', padding:'14px', backgroundColor:'#1a5c1a', color:'white', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginBottom:'8px', transition:'all 0.2s'}}>
              Continue
            </button>
            <button onClick={() => navigate('/')}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
              style={{width:'100%', padding:'12px', backgroundColor:'transparent', color:'#666', border:'1px solid #ccc', borderRadius:'8px', fontSize:'14px', cursor:'pointer', transition:'all 0.2s'}}>
              Back
            </button>
          </div>
        )}

        {/* Step 2 — Reason for Visit */}
        {step === 'reason' && (
          <div className="fade-in">
            {/* User info card */}
            <div style={{
              display:'flex', alignItems:'center', gap:'14px',
              backgroundColor:'rgba(255,255,255,0.6)',
              borderRadius:'12px', padding:'14px 16px', marginBottom:'20px',
              border:'1px solid rgba(26,92,26,0.15)'
            }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{width:'52px', height:'52px', borderRadius:'50%', objectFit:'cover', border:'2px solid #1a5c1a', flexShrink:0}} />
              ) : (
                <div style={{width:'52px', height:'52px', borderRadius:'50%', backgroundColor:'#1a5c1a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid #144d14'}}>
                  <span style={{color:'white', fontSize:'20px', fontWeight:'700'}}>{displayName?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <div style={{textAlign:'left', flex:1, minWidth:0}}>
                <p style={{margin:0, fontWeight:'700', color:'#1a5c1a', fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{displayName}</p>
                <p style={{margin:'2px 0 0', color:'#666', fontSize:'12px'}}>{displayProgram} · {displayCollege}</p>
                {displayEmail && <p style={{margin:'2px 0 0', color:'#888', fontSize:'11px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>📧 {displayEmail}</p>}
                {displayStudentId && <p style={{margin:'2px 0 0', color:'#999', fontSize:'11px'}}>🪪 {displayStudentId}</p>}
              </div>
            </div>

            <p style={{color:'#333', fontWeight:'700', fontSize:'15px', marginBottom:'16px', textAlign:'center'}}>
              What is your reason for visiting today?
            </p>

            {/* Reason Cards — 3 columns */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px'}}>
              {reasons.map(r => (
                <div
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  style={{
                    padding: '16px 8px', borderRadius: '12px',
                    border: reason === r.id ? `2.5px solid ${r.color}` : '2px solid #e0e0e0',
                    backgroundColor: reason === r.id ? r.bg : 'rgba(255,255,255,0.8)',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s ease',
                    transform: reason === r.id ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: reason === r.id ? `0 4px 16px ${r.color}33` : 'none'
                  }}
                  onMouseEnter={e => { if (reason !== r.id) { e.currentTarget.style.borderColor=r.color; e.currentTarget.style.backgroundColor=r.bg; e.currentTarget.style.transform='scale(1.03)' }}}
                  onMouseLeave={e => { if (reason !== r.id) { e.currentTarget.style.borderColor='#e0e0e0'; e.currentTarget.style.backgroundColor='rgba(255,255,255,0.8)'; e.currentTarget.style.transform='scale(1)' }}}
                >
                  <div style={{fontSize:'28px', marginBottom:'6px'}}>{r.icon}</div>
                  <div style={{fontSize:'11px', fontWeight:'600', color: reason === r.id ? r.color : '#333', lineHeight:'1.3'}}>{r.label}</div>
                </div>
              ))}
            </div>

            <label style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', cursor:'pointer'}}>
              <input type="checkbox" checked={isEmployee} onChange={e => setIsEmployee(e.target.checked)} style={{width:'16px', height:'16px', accentColor:'#1a5c1a'}} />
              <span style={{fontSize:'14px', color:'#333'}}>I am an employee (teacher/staff)</span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!reason || loading}
              onMouseEnter={e => { if (reason) { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor= reason ? '#1a5c1a' : '#aaa'; e.currentTarget.style.transform='translateY(0)' }}
              style={{
                width:'100%', padding:'15px',
                backgroundColor: reason ? '#1a5c1a' : '#aaa',
                color:'white', border:'none', borderRadius:'10px',
                fontSize:'16px', fontWeight:'700',
                cursor: reason ? 'pointer' : 'not-allowed',
                marginBottom:'8px', transition:'all 0.2s'
              }}>
              {loading ? 'Logging visit...' : 'Log My Visit'}
            </button>
            <button onClick={() => navigate('/')}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
              style={{width:'100%', padding:'12px', backgroundColor:'transparent', color:'#666', border:'1px solid #ccc', borderRadius:'8px', fontSize:'14px', cursor:'pointer', transition:'all 0.2s'}}>
              Back
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default VisitorPage