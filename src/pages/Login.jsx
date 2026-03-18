import { auth, provider, db } from '../firebase'
import { signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.jpg'

function Login() {
  const navigate = useNavigate()

  const handleLogin = async () => {
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
        const role = userDoc.data().role
        role === 'admin' ? navigate('/admin') : navigate('/visitor')
      }
    } catch (error) {
      console.error(error)
      alert('Login failed. Please try again.')
    }
  }

  // Hover effect handlers for card
  const handleCardHover = e => {
    e.currentTarget.style.transform = 'scale(1.02)'
    e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.6)'
  }
  const handleCardLeave = e => {
    e.currentTarget.style.transform = 'scale(1)'
    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'
  }

  // Hover effect handlers for login button
  const handleBtnHover = e => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.backgroundColor = '#144d14'
  }
  const handleBtnLeave = e => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.backgroundColor = '#1a5c1a'
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>

      {/* Blurred Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${schoolBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(2px)',
        zIndex: -1
      }}/>

      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 0
      }}/>

      {/* Centered Content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        boxSizing: 'border-box'
      }}>

        {/* Card */}
        <div 
          style={{
            backgroundColor: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            padding: '48px 40px',
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            borderTop: '5px solid #1a5c1a',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'default',
            zIndex: 1
          }}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >

          <img 
            src={neuLogo} 
            alt="NEU Logo" 
            style={{width:'110px', height:'110px', marginBottom:'16px'}} 
          />

          <h1 style={{
            color:'#1a5c1a',
            fontSize:'22px',
            fontWeight:'700',
            margin:'0 0 4px'
          }}>
            New Era University
          </h1>

          <h2 style={{
            color:'#333',
            fontSize:'16px',
            fontWeight:'500',
            margin:'0 0 8px'
          }}>
            Library Visitor Log System
          </h2>

          <div style={{
            display:'flex',
            height:'4px',
            borderRadius:'2px',
            overflow:'hidden',
            margin:'12px auto 24px',
            width:'80px'
          }}>
            <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
            <div style={{flex:1, backgroundColor:'#fff'}}/>
            <div style={{flex:1, backgroundColor:'#c0392b'}}/>
          </div>

          <p style={{
            color:'#666',
            fontSize:'14px',
            marginBottom:'32px'
          }}>
            Sign in with your institutional Google account to continue
          </p>

          <button 
            onClick={handleLogin} 
            onMouseEnter={handleBtnHover}
            onMouseLeave={handleBtnLeave}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#1a5c1a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px',
              transition: 'background-color 0.3s, transform 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            </svg>
            Sign in with Google
          </button>

          <p style={{
            color:'#999',
            fontSize:'12px',
            marginTop:'16px'
          }}>
            © {new Date().getFullYear()} New Era University · Library Services
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login