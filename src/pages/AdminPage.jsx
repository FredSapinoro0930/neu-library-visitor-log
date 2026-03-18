import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import neuLogo from '../assets/neu.png'

function AdminPage({ user }) {
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [users, setUsers] = useState([])
  const [filterReason, setFilterReason] = useState('')
  const [filterCollege, setFilterCollege] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const visitsSnapshot = await getDocs(collection(db, 'visits'))
    setVisits(visitsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    const usersSnapshot = await getDocs(collection(db, 'users'))
    setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const getFilteredVisits = () => {
    const now = new Date()
    return visits.filter(v => {
      const vDate = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp)
      let inRange = true
      if (dateRange === 'today') {
        inRange = vDate.toDateString() === now.toDateString()
      } else if (dateRange === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7)
        inRange = vDate >= weekAgo
      } else if (dateRange === 'month') {
        inRange = vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear()
      } else if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate); end.setHours(23, 59, 59)
        inRange = vDate >= start && vDate <= end
      }
      const matchReason = filterReason ? v.reason === filterReason : true
      const matchCollege = filterCollege ? v.college?.toLowerCase().includes(filterCollege.toLowerCase()) : true
      const matchEmployee = filterEmployee === '' ? true : filterEmployee === 'yes' ? v.isEmployee : !v.isEmployee
      const matchSearch = searchText ? (
        v.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.program?.toLowerCase().includes(searchText.toLowerCase()) ||
        v.reason?.toLowerCase().includes(searchText.toLowerCase())
      ) : true
      return inRange && matchReason && matchCollege && matchEmployee && matchSearch
    })
  }

  const handleBlock = async (userId, currentStatus) => {
    await updateDoc(doc(db, 'users', userId), { isBlocked: !currentStatus })
    fetchData()
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const exportPDF = () => {
    const filtered = getFilteredVisits()
    const pdf = new jsPDF()
    pdf.text('NEU Library Visitor Report', 14, 16)
    autoTable(pdf, {
      startY: 24,
      head: [['Name', 'Email', 'Program', 'College', 'Reason', 'Employee', 'Date']],
      body: filtered.map(v => [
        v.name, v.email, v.program, v.college, v.reason,
        v.isEmployee ? 'Yes' : 'No',
        v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : ''
      ])
    })
    pdf.save('neu-library-report.pdf')
  }

  const filtered = getFilteredVisits()

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none'
  }

  const cardStyle = {
    backgroundColor: 'white',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
    minWidth: '150px',
    borderTop: '4px solid'
  }

  const tabStyle = (tab) => ({
    padding: '12px 24px',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid white' : '3px solid transparent',
    backgroundColor: 'transparent',
    color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)',
    fontWeight: activeTab === tab ? '600' : '400',
    fontSize: '14px',
    cursor: 'pointer',
    letterSpacing: '0.3px'
  })

  return (
    <div style={{minHeight:'100vh', backgroundColor:'#f0f4f0'}}>

      {/* Header */}
      <div style={{backgroundColor:'#1a5c1a', boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div style={{maxWidth:'1200px', margin:'0 auto', padding:'0 24px'}}>

          {/* Top bar */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:'68px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <img src={neuLogo} alt="NEU" style={{width:'44px', height:'44px'}} />
              <div>
                <div style={{color:'white', fontWeight:'700', fontSize:'17px', letterSpacing:'0.3px'}}>NEU Library Admin</div>
                <div style={{color:'rgba(255,255,255,0.65)', fontSize:'12px'}}>New Era University · Library Services</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{textAlign:'right'}}>
                <div style={{color:'white', fontSize:'14px', fontWeight:'500'}}>{user.displayName}</div>
                <div style={{color:'rgba(255,255,255,0.65)', fontSize:'12px'}}>Administrator</div>
              </div>
              <button onClick={handleLogout} style={{
                padding:'8px 18px',
                backgroundColor:'rgba(255,255,255,0.15)',
                color:'white',
                border:'1px solid rgba(255,255,255,0.3)',
                borderRadius:'8px',
                cursor:'pointer',
                fontSize:'13px',
                fontWeight:'500'
              }}>
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', gap:'4px', borderTop:'1px solid rgba(255,255,255,0.15)'}}>
            <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button style={tabStyle('visitors')} onClick={() => setActiveTab('visitors')}>Visitor Logs</button>
            <button style={tabStyle('manage')} onClick={() => setActiveTab('manage')}>Manage Users</button>
          </div>

        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:'1200px', margin:'0 auto', padding:'24px'}}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{color:'#1a5c1a', marginBottom:'20px', fontSize:'20px', fontWeight:'600'}}>Visitor Statistics</h2>

            {/* Filters */}
            <div style={{backgroundColor:'white', padding:'16px 20px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:'20px', display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center'}}>
              <span style={{fontWeight:'600', color:'#555', fontSize:'14px'}}>Filter by:</span>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={inputStyle}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              {dateRange === 'custom' && <>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </>}
              <select value={filterReason} onChange={e => setFilterReason(e.target.value)} style={inputStyle}>
                <option value="">All Reasons</option>
                <option value="Reading">Reading</option>
                <option value="Researching">Researching</option>
                <option value="Use of Computer">Use of Computer</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
              <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={inputStyle}>
                <option value="">All Visitors</option>
                <option value="yes">Employees Only</option>
                <option value="no">Students Only</option>
              </select>
              <input placeholder="Filter by college" value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={inputStyle} />
            </div>

            {/* Stats Cards */}
            <div style={{display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'24px'}}>
              <div style={{...cardStyle, borderTopColor:'#1a5c1a'}}>
                <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'36px', fontWeight:'700'}}>{filtered.length}</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px'}}>Total Visits</p>
              </div>
              <div style={{...cardStyle, borderTopColor:'#c8a000'}}>
                <h2 style={{color:'#c8a000', margin:'0 0 4px', fontSize:'36px', fontWeight:'700'}}>{filtered.filter(v => v.isEmployee).length}</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px'}}>Employees</p>
              </div>
              <div style={{...cardStyle, borderTopColor:'#1a73e8'}}>
                <h2 style={{color:'#1a73e8', margin:'0 0 4px', fontSize:'36px', fontWeight:'700'}}>{filtered.filter(v => !v.isEmployee).length}</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px'}}>Students</p>
              </div>
              <div style={{...cardStyle, borderTopColor:'#c0392b'}}>
                <h2 style={{color:'#c0392b', margin:'0 0 4px', fontSize:'36px', fontWeight:'700'}}>{[...new Set(filtered.map(v => v.college))].filter(Boolean).length}</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px'}}>Colleges</p>
              </div>
              <div style={{...cardStyle, borderTopColor:'#6f42c1'}}>
                <h2 style={{color:'#6f42c1', margin:'0 0 4px', fontSize:'36px', fontWeight:'700'}}>{[...new Set(filtered.map(v => v.reason))].filter(Boolean).length}</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px'}}>Visit Reasons</p>
              </div>
            </div>

            {/* Reason Breakdown */}
            <div style={{backgroundColor:'white', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'24px', marginBottom:'24px'}}>
              <h3 style={{color:'#333', margin:'0 0 20px', fontSize:'15px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>Visits by Reason</h3>
              {['Reading','Researching','Use of Computer','Meeting','Other'].map(r => {
                const count = filtered.filter(v => v.reason === r).length
                const pct = filtered.length ? Math.round((count/filtered.length)*100) : 0
                return (
                  <div key={r} style={{marginBottom:'16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                      <span style={{fontSize:'14px', color:'#333', fontWeight:'500'}}>{r}</span>
                      <span style={{fontSize:'14px', color:'#888'}}>{count} visits ({pct}%)</span>
                    </div>
                    <div style={{backgroundColor:'#f0f0f0', borderRadius:'4px', height:'8px'}}>
                      <div style={{backgroundColor:'#1a5c1a', height:'8px', borderRadius:'4px', width:`${pct}%`, transition:'width 0.3s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Visitor Logs Tab */}
        {activeTab === 'visitors' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px'}}>
              <h2 style={{color:'#1a5c1a', margin:0, fontSize:'20px', fontWeight:'600'}}>Visitor Logs</h2>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                <input placeholder="Search name, program, reason..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{...inputStyle, width:'260px'}} />
                <button onClick={exportPDF} style={{padding:'8px 18px', backgroundColor:'#c0392b', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px'}}>
                  Export PDF
                </button>
              </div>
            </div>

            <div style={{backgroundColor:'white', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{backgroundColor:'#1a5c1a'}}>
                    {['Name','Email','Program','College','Reason','Employee','Date'].map(h => (
                      <th key={h} style={{padding:'14px 16px', textAlign:'left', color:'white', fontWeight:'600', fontSize:'13px', letterSpacing:'0.3px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{padding:'40px', textAlign:'center', color:'#999'}}>No visits found.</td></tr>
                  ) : filtered.map((v, i) => (
                    <tr key={v.id} style={{backgroundColor: i % 2 === 0 ? 'white' : '#f9fdf9', borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'12px 16px', fontWeight:'500'}}>{v.name}</td>
                      <td style={{padding:'12px 16px', color:'#666'}}>{v.email}</td>
                      <td style={{padding:'12px 16px'}}>{v.program}</td>
                      <td style={{padding:'12px 16px'}}>{v.college}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'12px', backgroundColor:'#e8f5e9', color:'#1a5c1a', fontWeight:'500'}}>{v.reason}</span>
                      </td>
                      <td style={{padding:'12px 16px'}}>{v.isEmployee ? 'Yes' : 'No'}</td>
                      <td style={{padding:'12px 16px', color:'#666'}}>{v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Manage Users Tab */}
        {activeTab === 'manage' && (
          <>
            <h2 style={{color:'#1a5c1a', marginBottom:'20px', fontSize:'20px', fontWeight:'600'}}>Manage Users</h2>
            <div style={{backgroundColor:'white', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{backgroundColor:'#1a5c1a'}}>
                    {['Name','Email','Role','Status','Action'].map(h => (
                      <th key={h} style={{padding:'14px 16px', textAlign:'left', color:'white', fontWeight:'600', fontSize:'13px', letterSpacing:'0.3px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{backgroundColor: i % 2 === 0 ? 'white' : '#f9fdf9', borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'12px 16px', fontWeight:'500'}}>{u.name}</td>
                      <td style={{padding:'12px 16px', color:'#666'}}>{u.email}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'12px', backgroundColor: u.role === 'admin' ? '#e8f5e9' : '#e8f0fe', color: u.role === 'admin' ? '#1a5c1a' : '#1a73e8', fontWeight:'500'}}>{u.role}</span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'12px', backgroundColor: u.isBlocked ? '#fce8e6' : '#e8f5e9', color: u.isBlocked ? '#c0392b' : '#1a5c1a', fontWeight:'500'}}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleBlock(u.id, u.isBlocked)} style={{padding:'6px 14px', backgroundColor: u.isBlocked ? '#1a5c1a' : '#c0392b', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}>
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default AdminPage