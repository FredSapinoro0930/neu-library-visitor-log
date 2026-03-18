import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import neuLogo from '../assets/neu.png'
import schoolBg from '../assets/6-51.png'

function ChoicePage({ user }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <div style={{position:'relative', minHeight:'100vh', width:'100vw', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', boxSizing:'border-box'}}>
      <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', backgroundImage:`url(${schoolBg})`, backgroundSize:'cover', backgroundPosition:'center', filter:'blur(2px)', zIndex:-1}}/>
      <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.45)', zIndex:0}}/>

      <div style={{
        position:'relative', zIndex:1,
        backgroundColor:'rgba(255,255,255,0.85)',
        backdropFilter:'blur(8px)',
        borderRadius:'16px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        padding:'48px 40px',
        width:'100%',
        maxWidth:'440px',
        textAlign:'center',
        borderTop:'5px solid #1a5c1a'
      }}>
        <img src={neuLogo} alt="NEU Logo" style={{width:'90px', height:'90px', marginBottom:'12px'}} />
        <h1 style={{color:'#1a5c1a', fontSize:'20px', fontWeight:'700', margin:'0 0 4px'}}>Welcome, {user?.displayName}!</h1>
        <p style={{color:'#555', fontSize:'14px', margin:'0 0 8px'}}>How would you like to continue?</p>

        <div style={{display:'flex', height:'1px', borderRadius:'2px', overflow:'hidden', margin:'12px auto 28px', width:'200px'}}>
          <div style={{flex:1, backgroundColor:'#1a5c1a'}}/>
          <div style={{flex:1, backgroundColor:'#fff'}}/>
          <div style={{flex:1, backgroundColor:'#c0392b'}}/>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <button onClick={() => navigate('/admin')} style={{
            padding:'16px',
            backgroundColor:'#1a5c1a',
            color:'white',
            border:'none',
            borderRadius:'10px',
            fontSize:'15px',
            fontWeight:'600',
            cursor:'pointer'
          }}>
            Admin Dashboard
            <div style={{fontSize:'12px', fontWeight:'400', opacity:0.8, marginTop:'2px'}}>View statistics and manage visitors</div>
          </button>

          <button onClick={() => navigate('/visitor')} style={{
            padding:'16px',
            backgroundColor:'white',
            color:'#1a5c1a',
            border:'2px solid #1a5c1a',
            borderRadius:'10px',
            fontSize:'15px',
            fontWeight:'600',
            cursor:'pointer'
          }}>
            Visitor Check-in
            <div style={{fontSize:'12px', fontWeight:'400', color:'#666', marginTop:'2px'}}>Log a visit to the library</div>
          </button>

          <button onClick={handleLogout} style={{
            padding:'11px',
            backgroundColor:'transparent',
            color:'#888',
            border:'1px solid #ddd',
            borderRadius:'8px',
            fontSize:'13px',
            cursor:'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoicePage