import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
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
  const [animating, setAnimating] = useState(false)
  const [hoveredTab, setHoveredTab] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const visitsSnapshot = await getDocs(collection(db, 'visits'))
    setVisits(visitsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    const usersSnapshot = await getDocs(collection(db, 'users'))
    setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const switchTab = (newTab) => {
    if (newTab === activeTab) return
    setAnimating(true)
    setTimeout(() => {
      setActiveTab(newTab)
      setAnimating(false)
    }, 200)
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

  const handleClearLogs = async () => {
    const confirm = window.confirm('Are you sure you want to delete ALL visitor logs? This cannot be undone.')
    if (!confirm) return
    try {
      const snapshot = await getDocs(collection(db, 'visits'))
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'visits', d.id)))
      await Promise.all(deletePromises)
      fetchData()
      alert('All visitor logs have been cleared.')
    } catch (error) {
      console.error(error)
      alert('Failed to clear logs.')
    }
  }

  const exportPDF = () => {
    const filtered = getFilteredVisits()
    const pdf = new jsPDF()
    pdf.text('NEU Library Visitor Report', 14, 16)
    autoTable(pdf, {
      startY: 24,
      head: [['Name', 'Email', 'Program', 'College', 'Reason', 'Type', 'Date']],
      body: filtered.map(v => [
        v.name, v.email, v.program, v.college, v.reason,
        v.isEmployee ? 'Employee' : 'Student',
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
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const tabStyle = (tab) => ({
    padding: '14px 28px',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid white' : hoveredTab === tab ? '3px solid rgba(255,255,255,0.4)' : '3px solid transparent',
    backgroundColor: hoveredTab === tab && activeTab !== tab ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: activeTab === tab ? 'white' : hoveredTab === tab ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
    fontWeight: activeTab === tab ? '700' : '400',
    fontSize: '14px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'all 0.25s ease',
    transform: hoveredTab === tab && activeTab !== tab ? 'translateY(-1px)' : 'translateY(0)'
  })

  const statCards = [
    { label: 'Total Visits', value: filtered.length, color: '#1a5c1a', bg: '#e8f5e9' },
    { label: 'Employees', value: filtered.filter(v => v.isEmployee).length, color: '#c8a000', bg: '#fffde7' },
    { label: 'Students', value: filtered.filter(v => !v.isEmployee).length, color: '#1a73e8', bg: '#e8f0fe' },
    { label: 'Colleges', value: [...new Set(filtered.map(v => v.college))].filter(Boolean).length, color: '#c0392b', bg: '#fce8e6' },
    { label: 'Visit Reasons', value: [...new Set(filtered.map(v => v.reason))].filter(Boolean).length, color: '#6f42c1', bg: '#f3e8fd' }
  ]

  return (
    <div style={{minHeight:'100vh', backgroundColor:'#f0f4f0'}}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5c1a 0%, #0d3d0d 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <div style={{maxWidth:'1200px', margin:'0 auto', padding:'0 24px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:'72px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div style={{
                width:'48px', height:'48px',
                backgroundColor:'white',
                borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <img src={neuLogo} alt="NEU" style={{width:'40px', height:'40px', borderRadius:'50%'}} />
              </div>
              <div>
                <div style={{color:'white', fontWeight:'700', fontSize:'18px', letterSpacing:'0.3px'}}>NEU Library Admin</div>
                <div style={{color:'rgba(255,255,255,0.6)', fontSize:'12px'}}>New Era University · Library Services</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
              <div style={{textAlign:'right'}}>
                <div style={{color:'white', fontSize:'14px', fontWeight:'600'}}>{user.displayName}</div>
                <div style={{
                  display:'inline-block',
                  backgroundColor:'rgba(255,255,255,0.15)',
                  color:'rgba(255,255,255,0.85)',
                  fontSize:'11px',
                  padding:'2px 8px',
                  borderRadius:'20px',
                  marginTop:'2px'
                }}>Administrator</div>
              </div>
              <button
                onClick={handleLogout}
                onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.12)'}
                style={{
                  padding:'9px 20px',
                  backgroundColor:'rgba(255,255,255,0.12)',
                  color:'white',
                  border:'1px solid rgba(255,255,255,0.25)',
                  borderRadius:'8px',
                  cursor:'pointer',
                  fontSize:'13px',
                  fontWeight:'500',
                  transition:'background-color 0.2s'
                }}>
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', gap:'4px', borderTop:'1px solid rgba(255,255,255,0.12)'}}>
            {['dashboard', 'visitors', 'manage'].map(t => (
              <button
                key={t}
                style={tabStyle(t)}
                onClick={() => switchTab(t)}
                onMouseEnter={() => setHoveredTab(t)}
                onMouseLeave={() => setHoveredTab(null)}>
                {t === 'dashboard' ? 'Dashboard' : t === 'visitors' ? 'Visitor Logs' : 'Manage Users'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth:'1200px', margin:'0 auto', padding:'28px 24px',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease'
      }}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{color:'#1a5c1a', margin:0, fontSize:'20px', fontWeight:'700'}}>Visitor Statistics</h2>
              <span style={{color:'#888', fontSize:'13px'}}>{new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</span>
            </div>

            {/* Filters */}
            <div style={{
              backgroundColor:'white', padding:'16px 20px', borderRadius:'12px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'20px',
              display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center',
              borderLeft:'4px solid #1a5c1a'
            }}>
              <span style={{fontWeight:'700', color:'#1a5c1a', fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.5px'}}>Filter</span>
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
              <input placeholder="Filter by college..." value={filterCollege} onChange={e => setFilterCollege(e.target.value)} style={inputStyle} />
            </div>

            {/* Stats Cards */}
            <div style={{display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'24px'}}>
              {statCards.map((card, i) => (
                <div
                  key={card.label}
                  style={{
                    backgroundColor:'white',
                    padding:'20px 24px',
                    borderRadius:'14px',
                    boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                    textAlign:'center',
                    minWidth:'150px',
                    flex:'1',
                    borderTop:`4px solid ${card.color}`,
                    transition:'transform 0.25s ease, box-shadow 0.25s ease',
                    cursor:'default'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{
                    width:'48px', height:'48px',
                    backgroundColor: card.bg,
                    borderRadius:'12px',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 12px'
                  }}>
                    <span style={{fontSize:'22px', fontWeight:'800', color: card.color}}>{card.value}</span>
                  </div>
                  <p style={{color:'#888', margin:0, fontSize:'12px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Reason Breakdown */}
            <div style={{backgroundColor:'white', borderRadius:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'24px', borderLeft:'4px solid #1a5c1a'}}>
              <h3 style={{color:'#1a5c1a', margin:'0 0 20px', fontSize:'14px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px'}}>Visits by Reason</h3>
              {['Reading','Researching','Use of Computer','Meeting','Other'].map((r, i) => {
                const count = filtered.filter(v => v.reason === r).length
                const pct = filtered.length ? Math.round((count/filtered.length)*100) : 0
                const colors = ['#1a5c1a', '#1a73e8', '#c8a000', '#c0392b', '#6f42c1']
                return (
                  <div key={r} style={{marginBottom:'16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px', alignItems:'center'}}>
                      <span style={{fontSize:'14px', color:'#333', fontWeight:'500'}}>{r}</span>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{
                          padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                          backgroundColor: count > 0 ? '#e8f5e9' : '#f5f5f5',
                          color: count > 0 ? '#1a5c1a' : '#999'
                        }}>{count} visits</span>
                        <span style={{fontSize:'13px', color:'#888', minWidth:'36px', textAlign:'right'}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{backgroundColor:'#f0f0f0', borderRadius:'6px', height:'10px', overflow:'hidden'}}>
                      <div style={{
                        backgroundColor: colors[i],
                        height:'10px',
                        borderRadius:'6px',
                        width:`${pct}%`,
                        transition:'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}/>
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
              <h2 style={{color:'#1a5c1a', margin:0, fontSize:'20px', fontWeight:'700'}}>Visitor Logs</h2>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                <input
                  placeholder="Search name, program, reason..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{...inputStyle, width:'260px'}}
                />
                <button
                  onClick={exportPDF}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#a93226'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#c0392b'; e.currentTarget.style.transform='translateY(0)' }}
                  style={{padding:'8px 18px', backgroundColor:'#c0392b', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px', transition:'all 0.2s'}}>
                  Export PDF
                </button>
                <button
                  onClick={handleClearLogs}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#444'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#555'; e.currentTarget.style.transform='translateY(0)' }}
                  style={{padding:'8px 18px', backgroundColor:'#555', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px', transition:'all 0.2s'}}>
                  Clear All Logs
                </button>
              </div>
            </div>

            <div style={{backgroundColor:'white', borderRadius:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #1a5c1a 0%, #0d3d0d 100%)'}}>
                    {['Name','Email','Program','College','Reason','Type','Date'].map(h => (
                      <th key={h} style={{padding:'14px 16px', textAlign:'left', color:'white', fontWeight:'600', fontSize:'12px', letterSpacing:'0.5px', textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{padding:'48px', textAlign:'center', color:'#999'}}>
                        <div style={{fontSize:'32px', marginBottom:'8px'}}>📋</div>
                        <div style={{fontWeight:'500'}}>No visits found</div>
                        <div style={{fontSize:'13px', marginTop:'4px'}}>Try adjusting your filters</div>
                      </td>
                    </tr>
                  ) : filtered.map((v, i) => (
                    <tr
                      key={v.id}
                      style={{backgroundColor: i % 2 === 0 ? 'white' : '#f9fdf9', borderBottom:'1px solid #f0f0f0', transition:'background-color 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#f9fdf9'}>
                      <td style={{padding:'12px 16px', fontWeight:'500'}}>{v.name}</td>
                      <td style={{padding:'12px 16px', color:'#666', fontSize:'13px'}}>{v.email}</td>
                      <td style={{padding:'12px 16px'}}>{v.program}</td>
                      <td style={{padding:'12px 16px'}}>{v.college}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'12px', backgroundColor:'#e8f5e9', color:'#1a5c1a', fontWeight:'600'}}>{v.reason}</span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'12px', backgroundColor: v.isEmployee ? '#fffde7' : '#e8f0fe', color: v.isEmployee ? '#c8a000' : '#1a73e8', fontWeight:'600'}}>
                          {v.isEmployee ? 'Employee' : 'Student'}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px', color:'#666', fontSize:'13px'}}>{v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : ''}</td>
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
            <h2 style={{color:'#1a5c1a', marginBottom:'20px', fontSize:'20px', fontWeight:'700'}}>Manage Users</h2>
            <div style={{backgroundColor:'white', borderRadius:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #1a5c1a 0%, #0d3d0d 100%)'}}>
                    {['Name','Email','Role','Status','Action'].map(h => (
                      <th key={h} style={{padding:'14px 16px', textAlign:'left', color:'white', fontWeight:'600', fontSize:'12px', letterSpacing:'0.5px', textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{backgroundColor: i % 2 === 0 ? 'white' : '#f9fdf9', borderBottom:'1px solid #f0f0f0', transition:'background-color 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#f9fdf9'}>
                      <td style={{padding:'12px 16px', fontWeight:'600'}}>{u.name}</td>
                      <td style={{padding:'12px 16px', color:'#666', fontSize:'13px'}}>{u.email}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{
                          padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600',
                          backgroundColor: u.role === 'admin' ? '#e8f5e9' : '#e8f0fe',
                          color: u.role === 'admin' ? '#1a5c1a' : '#1a73e8'
                        }}>{u.role}</span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{
                          padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600',
                          backgroundColor: u.isBlocked ? '#fce8e6' : '#e8f5e9',
                          color: u.isBlocked ? '#c0392b' : '#1a5c1a'
                        }}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBlock(u.id, u.isBlocked)}
                            onMouseEnter={e => { e.currentTarget.style.opacity='0.85'; e.currentTarget.style.transform='translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}
                            style={{
                              padding:'6px 16px',
                              backgroundColor: u.isBlocked ? '#1a5c1a' : '#c0392b',
                              color:'white', border:'none', borderRadius:'8px',
                              cursor:'pointer', fontSize:'12px', fontWeight:'600',
                              transition:'all 0.2s'
                            }}>
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