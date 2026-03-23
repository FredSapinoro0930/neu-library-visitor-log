import { useState } from 'react'
import { db, auth } from '../firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.png'

function AdminRegister() {
  const navigate = useNavigate()
  const user = auth.currentUser
  const [adminType, setAdminType] = useState('professor')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [program, setProgram] = useState('')
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'users'), where('email', '==', user.email))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const updateData = { name: user.displayName }
        if (adminType === 'professor') {
          updateData.employeeId = employeeId || ''
          updateData.department = department || ''
          updateData.position = position || ''
          updateData.college = department || ''
          updateData.program = position || ''
          updateData.adminType = 'professor'
        } else {
          updateData.studentId = studentId || ''
          updateData.program = program || ''
          updateData.college = college || ''
          updateData.adminType = 'student'
        }
        await updateDoc(doc(db, 'users', snap.docs[0].id), updateData)
      }
      navigate('/admin')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
    marginBottom: '16px', outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontWeight: '600', color: '#333', fontSize: '14px'
  }

  const handleInputFocus = e => {
    e.currentTarget.style.borderColor = '#1a5c1a'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,92,26,0.1)'
  }

  const handleInputBlur = e => {
    e.currentTarget.style.borderColor = '#ddd'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
      padding: '40px 20px', boxSizing: 'border-box'
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

      {/* Card */}
      <div
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.style.boxShadow='0 25px 70px rgba(0,0,0,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.5)' }}
        style={{
          position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', padding: '48px 40px',
          width: '100%', maxWidth: '460px', textAlign: 'center',
          borderTop: '5px solid #1a5c1a',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>

        {/* Profile picture */}
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" style={{
            width:'90px', height:'90px', borderRadius:'50%',
            objectFit:'cover', border:'3px solid #1a5c1a', marginBottom:'12px'
          }}/>
        ) : (
          <div style={{
            width:'90px', height:'90px', borderRadius:'50%',
            backgroundColor:'#1a5c1a', display:'flex', alignItems:'center',
            justifyContent:'center', margin:'0 auto 12px', border:'3px solid #144d14'
          }}>
            <span style={{color:'white', fontSize:'32px', fontWeight:'700'}}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}

        <h1 style={{color:'#1a5c1a', fontSize:'20px', fontWeight:'700', margin:'0 0 4px'}}>
          Welcome, {user?.displayName}!
        </h1>
        <p style={{color:'#888', fontSize:'13px', margin:'0 0 4px'}}>{user?.email}</p>
        <div style={{
          display:'inline-block', backgroundColor:'#e8f5e9',
          color:'#1a5c1a', fontSize:'11px', fontWeight:'700',
          padding:'3px 12px', borderRadius:'20px', marginTop:'4px'
        }}>
          Administrator
        </div>

        <div style={{display:'flex', height:'2px', overflow:'hidden', margin:'16px auto 20px', width:'200px'}}>
          <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
          <div style={{flex:1, backgroundColor:'#fff'}}/>
          <div style={{flex:1, backgroundColor:'#c0392b'}}/>
        </div>

        <p style={{color:'#1a5c1a', fontWeight:'700', fontSize:'15px', marginBottom:'6px'}}>
          Complete your profile
        </p>
        <p style={{color:'#888', fontSize:'13px', marginBottom:'20px'}}>
          All fields are optional. You can skip and go straight to the dashboard.
        </p>

        {/* Toggle — Professor or Student */}
        <div style={{display:'flex', backgroundColor:'rgba(240,240,240,0.8)', borderRadius:'10px', padding:'4px', marginBottom:'24px'}}>
          <button
            onClick={() => setAdminType('professor')}
            style={{
              flex:1, padding:'10px', border:'none', borderRadius:'8px', cursor:'pointer',
              fontSize:'13px', fontWeight:'600',
              backgroundColor: adminType === 'professor' ? 'white' : 'transparent',
              color: adminType === 'professor' ? '#1a5c1a' : '#666',
              boxShadow: adminType === 'professor' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
            👨‍🏫 Professor / Staff
          </button>
          <button
            onClick={() => setAdminType('student')}
            style={{
              flex:1, padding:'10px', border:'none', borderRadius:'8px', cursor:'pointer',
              fontSize:'13px', fontWeight:'600',
              backgroundColor: adminType === 'student' ? 'white' : 'transparent',
              color: adminType === 'student' ? '#1a5c1a' : '#666',
              boxShadow: adminType === 'student' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
            🎓 Student 
          </button>
        </div>

        <div style={{textAlign:'left'}}>

          {/* Professor fields */}
          {adminType === 'professor' && (
            <div className="fade-in">
              <label style={labelStyle}>
                Employee ID <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
              <input
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-12345"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              <label style={labelStyle}>
                Department / College <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
              <input
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. CICS, CBA, Library"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              <label style={labelStyle}>
                Position <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
             <input
  value={position}
  onChange={e => setPosition(e.target.value)}
  placeholder="e.g. Professor, Instructor, Librarian"
  style={inputStyle}
  onFocus={handleInputFocus}
  onBlur={handleInputBlur}
/>
            </div>
          )}

          {/* Student fields */}
          {adminType === 'student' && (
            <div className="fade-in">
              <label style={labelStyle}>
                Student ID <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
              <input
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="12-34567-890"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              <label style={labelStyle}>
                Program <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
              <input
                value={program}
                onChange={e => setProgram(e.target.value)}
                placeholder="e.g. BSIT, BSCS, BSED"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              <label style={labelStyle}>
                College <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span>
              </label>
              <input
                value={college}
                onChange={e => setCollege(e.target.value)}
                placeholder="e.g. CICS, CBA, CEA"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          )}

        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
          style={{
            width: '100%', padding: '15px', backgroundColor: '#1a5c1a',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s', marginTop: '8px', marginBottom: '10px'
          }}>
          {loading ? 'Saving...' : 'Continue to Dashboard'}
        </button>

        {/* Skip button */}
        <button
          onClick={() => navigate('/admin')}
          onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f0f0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
          style={{
            width: '100%', padding: '12px', backgroundColor: 'transparent',
            color: '#888', border: '1px solid #ddd', borderRadius: '10px',
            fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
          }}>
          Skip for now
        </button>

      </div>
    </div>
  )
}

export default AdminRegister