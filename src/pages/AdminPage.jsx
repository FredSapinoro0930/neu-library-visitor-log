import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore'
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
  const [now, setNow] = useState(new Date())

  // Profile states
  const [adminProfile, setAdminProfile] = useState(null)
  const [adminDocId, setAdminDocId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editEmployeeId, setEditEmployeeId] = useState('')
  const [editStudentId, setEditStudentId] = useState('')
  const [editProgram, setEditProgram] = useState('')
  const [editCollege, setEditCollege] = useState('')
  const [editAdminType, setEditAdminType] = useState('professor')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchData()
    fetchAdminProfile()
  }, [])

  const fetchData = async () => {
    const visitsSnapshot = await getDocs(collection(db, 'visits'))
    setVisits(visitsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    const usersSnapshot = await getDocs(collection(db, 'users'))
    setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const fetchAdminProfile = async () => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', user.email))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const data = snap.docs[0].data()
        setAdminProfile(data)
        setAdminDocId(snap.docs[0].id)
        setEditName(data.name || user.displayName || '')
        setEditDepartment(data.department || data.college || '')
        setEditPosition(data.position || data.program || '')
        setEditEmployeeId(data.employeeId || '')
        setEditStudentId(data.studentId || '')
        setEditProgram(data.program || '')
        setEditCollege(data.college || data.department || '')
        setEditAdminType(data.adminType || 'professor')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      const updateData = {
        name: editName,
        adminType: editAdminType
      }
      if (editAdminType === 'professor') {
        updateData.department = editDepartment
        updateData.position = editPosition
        updateData.employeeId = editEmployeeId
        updateData.college = editDepartment
        updateData.program = editPosition
      } else {
        updateData.studentId = editStudentId
        updateData.program = editProgram
        updateData.college = editCollege
        updateData.department = editCollege
      }
      await updateDoc(doc(db, 'users', adminDocId), updateData)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
      fetchAdminProfile()
    } catch (err) {
      console.error(err)
      alert('Failed to save profile.')
    }
    setProfileSaving(false)
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
      head: [['Name', 'Email', 'Program', 'College', 'Reason', 'Type', 'Date', 'Time']],
      body: filtered.map(v => [
        v.name, v.email, v.program, v.college, v.reason,
        v.isEmployee ? 'Employee' : 'Student',
        v.timestamp?.toDate ? v.timestamp.toDate().toLocaleDateString() : '',
        v.timestamp?.toDate ? v.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
      ])
    })
    pdf.save('neu-library-report.pdf')
  }

  const filtered = getFilteredVisits()

  const inputStyle = {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', backgroundColor: 'white', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const profileInputStyle = {
    width: '100%', padding: '12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
    marginBottom: '16px', outline: 'none', backgroundColor: 'white',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  const tabStyle = (tab) => ({
    padding: '14px 28px', border: 'none',
    borderBottom: activeTab === tab ? '3px solid white' : hoveredTab === tab ? '3px solid rgba(255,255,255,0.4)' : '3px solid transparent',
    backgroundColor: hoveredTab === tab && activeTab !== tab ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: activeTab === tab ? 'white' : hoveredTab === tab ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
    fontWeight: activeTab === tab ? '700' : '400',
    fontSize: '14px', cursor: 'pointer', letterSpacing: '0.3px',
    transition: 'all 0.25s ease',
    transform: hoveredTab === tab && activeTab !== tab ? 'translateY(-1px)' : 'translateY(0)'
  })

  const statCards = [
    { label: 'Total Visits', value: filtered.length, color: '#1a5c1a', bg: '#e8f5e9', icon: '👥' },
    { label: 'Employees', value: filtered.filter(v => v.isEmployee).length, color: '#c8a000', bg: '#fffde7', icon: '👔' },
    { label: 'Students', value: filtered.filter(v => !v.isEmployee).length, color: '#1a73e8', bg: '#e8f0fe', icon: '🎓' },
    { label: 'Colleges', value: [...new Set(filtered.map(v => v.college))].filter(Boolean).length, color: '#c0392b', bg: '#fce8e6', icon: '🏫' },
    { label: 'Visit Reasons', value: [...new Set(filtered.map(v => v.reason))].filter(Boolean).length, color: '#6f42c1', bg: '#f3e8fd', icon: '📋' }
  ]

  const handleProfileInputFocus = e => { e.currentTarget.style.borderColor='#1a5c1a'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,92,26,0.1)' }
  const handleProfileInputBlur = e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.boxShadow='none' }

  return (
    <div style={{minHeight:'100vh', backgroundColor:'#f4f6f8'}}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(to bottom, #1a5c1a 0%, #1a5c1a 88%, #ffffff 88%, #ffffff 94%, #c0392b 94%, #c0392b 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{maxWidth:'1300px', margin:'0 auto', padding:'0 32px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:'72px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div style={{
                width:'48px', height:'48px', backgroundColor:'white',
                borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.15)'
              }}>
                <img src={neuLogo} alt="NEU" style={{width:'42px', height:'42px', borderRadius:'50%'}} />
              </div>
              <div>
                <div style={{color:'white', fontWeight:'800', fontSize:'18px'}}>NEU Library Admin</div>
                <div style={{color:'rgba(255,255,255,0.6)', fontSize:'12px'}}>New Era University · Library Services</div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <div style={{textAlign:'right'}}>
                <div style={{color:'white', fontFamily:'monospace', fontSize:'18px', fontWeight:'700', letterSpacing:'1px'}}>
                  {now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                </div>
                <div style={{color:'rgba(255,255,255,0.6)', fontSize:'11px'}}>
                  {now.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'})}
                </div>
              </div>
              <div style={{width:'1px', height:'36px', backgroundColor:'rgba(255,255,255,0.2)'}}/>
              {/* Admin avatar */}
              <div style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}} onClick={() => switchTab('profile')}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{width:'38px', height:'38px', borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.5)'}}/>
                ) : (
                  <div style={{width:'38px', height:'38px', borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid rgba(255,255,255,0.5)'}}>
                    <span style={{color:'white', fontSize:'16px', fontWeight:'700'}}>{user?.displayName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                <div style={{textAlign:'right'}}>
                  <div style={{color:'white', fontSize:'14px', fontWeight:'600'}}>{user.displayName}</div>
                  <div style={{
                    display:'inline-block', backgroundColor:'rgba(255,255,255,0.18)',
                    color:'rgba(255,255,255,0.9)', fontSize:'11px',
                    padding:'2px 10px', borderRadius:'20px', marginTop:'2px'
                  }}>Administrator</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.28)'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.12)'; e.currentTarget.style.transform='translateY(0)' }}
                style={{
                  padding:'9px 22px', backgroundColor:'rgba(255,255,255,0.12)',
                  color:'white', border:'1.5px solid rgba(255,255,255,0.3)',
                  borderRadius:'10px', cursor:'pointer', fontSize:'13px',
                  fontWeight:'600', transition:'all 0.2s'
                }}>
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', gap:'4px', borderTop:'1px solid rgba(255,255,255,0.12)'}}>
            {['dashboard', 'visitors', 'manage', 'profile'].map(t => (
              <button
                key={t}
                style={tabStyle(t)}
                onClick={() => switchTab(t)}
                onMouseEnter={() => setHoveredTab(t)}
                onMouseLeave={() => setHoveredTab(null)}>
                {t === 'dashboard' ? 'Dashboard' : t === 'visitors' ? 'Visitor Logs' : t === 'manage' ? 'Manage Users' : 'My Profile'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth:'1300px', margin:'0 auto', padding:'32px',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease'
      }}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <div>
                <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'22px', fontWeight:'800'}}>Visitor Statistics</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px'}}>Overview of library visits and activity</p>
              </div>
              <div style={{backgroundColor:'white', padding:'12px 20px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', textAlign:'right'}}>
                <div style={{color:'#1a5c1a', fontFamily:'monospace', fontSize:'20px', fontWeight:'700', letterSpacing:'1px'}}>
                  {now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                </div>
                <div style={{color:'#888', fontSize:'12px', marginTop:'2px'}}>
                  {now.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{
              backgroundColor:'white', padding:'18px 24px', borderRadius:'16px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'24px',
              display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center',
              borderLeft:'5px solid #1a5c1a'
            }}>
              <span style={{fontWeight:'800', color:'#1a5c1a', fontSize:'12px', textTransform:'uppercase', letterSpacing:'1px'}}>Filter</span>
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
                <option value="Internet Access">Internet Access</option>
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
                    backgroundColor:'white', padding:'24px', borderRadius:'16px',
                    boxShadow:'0 2px 12px rgba(0,0,0,0.06)', textAlign:'center',
                    minWidth:'160px', flex:'1', borderTop:`4px solid ${card.color}`,
                    transition:'transform 0.25s ease, box-shadow 0.25s ease', cursor:'default'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <div style={{width:'56px', height:'56px', backgroundColor:card.bg, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'24px'}}>
                    {card.icon}
                  </div>
                  <div style={{fontSize:'36px', fontWeight:'800', color:card.color, lineHeight:1, marginBottom:'8px'}}>{card.value}</div>
                  <p style={{color:'#999', margin:0, fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px'}}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Reason Breakdown */}
            <div style={{backgroundColor:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'28px', borderLeft:'5px solid #1a5c1a'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                <h3 style={{color:'#1a5c1a', margin:0, fontSize:'14px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px'}}>Visits by Reason</h3>
                <span style={{color:'#999', fontSize:'12px'}}>{filtered.length} total visits</span>
              </div>
              {['Reading','Researching','Use of Computer','Internet Access','Meeting','Other'].map((r, i) => {
                const count = filtered.filter(v => v.reason === r).length
                const pct = filtered.length ? Math.round((count/filtered.length)*100) : 0
                const colors = ['#1a5c1a','#1a73e8','#c8a000','#0097a7','#c0392b','#6f42c1']
                return (
                  <div key={r} style={{marginBottom:'20px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', alignItems:'center'}}>
                      <span style={{fontSize:'14px', color:'#333', fontWeight:'600'}}>{r}</span>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', backgroundColor: count > 0 ? '#e8f5e9' : '#f5f5f5', color: count > 0 ? '#1a5c1a' : '#bbb'}}>{count} visits</span>
                        <span style={{fontSize:'13px', color:'#aaa', minWidth:'36px', textAlign:'right', fontWeight:'600'}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{backgroundColor:'#f0f2f5', borderRadius:'8px', height:'12px', overflow:'hidden'}}>
                      <div style={{backgroundColor:colors[i], height:'12px', borderRadius:'8px', width:`${pct}%`, transition:'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow:`0 2px 6px ${colors[i]}44`}}/>
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
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px'}}>
              <div>
                <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'22px', fontWeight:'800'}}>Visitor Logs</h2>
                <p style={{color:'#888', margin:0, fontSize:'13px'}}>{filtered.length} records found</p>
              </div>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                <input
                  placeholder="Search name, program, reason..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor='#1a5c1a'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(26,92,26,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor='#ddd'; e.currentTarget.style.boxShadow='none' }}
                  style={{...inputStyle, width:'260px'}}
                />
                <button
                  onClick={exportPDF}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#a93226'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#c0392b'; e.currentTarget.style.transform='translateY(0)' }}
                  style={{padding:'9px 20px', backgroundColor:'#c0392b', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', transition:'all 0.2s'}}>
                  Export PDF
                </button>
                <button
                  onClick={handleClearLogs}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#444'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#666'; e.currentTarget.style.transform='translateY(0)' }}
                  style={{padding:'9px 20px', backgroundColor:'#666', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'13px', transition:'all 0.2s'}}>
                  Clear All Logs
                </button>
              </div>
            </div>

            <div style={{backgroundColor:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #1a5c1a 0%, #0d3d0d 100%)'}}>
                    {['Name','Email','Program','College','Reason','Type','Date & Time'].map(h => (
                      <th key={h} style={{padding:'16px 18px', textAlign:'left', color:'white', fontWeight:'700', fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{padding:'64px', textAlign:'center', color:'#bbb'}}>
                        <div style={{fontSize:'40px', marginBottom:'12px'}}>📋</div>
                        <div style={{fontWeight:'700', fontSize:'16px', color:'#999', marginBottom:'4px'}}>No visits found</div>
                        <div style={{fontSize:'13px'}}>Try adjusting your filters</div>
                      </td>
                    </tr>
                  ) : filtered.map((v, i) => (
                    <tr
                      key={v.id}
                      style={{backgroundColor: i % 2 === 0 ? 'white' : '#fafafa', borderBottom:'1px solid #f0f0f0', transition:'all 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa'}>
                      <td style={{padding:'14px 18px', fontWeight:'600', color:'#222'}}>{v.name}</td>
                      <td style={{padding:'14px 18px', color:'#888', fontSize:'12px'}}>{v.email}</td>
                      <td style={{padding:'14px 18px', color:'#555'}}>{v.program}</td>
                      <td style={{padding:'14px 18px', color:'#555'}}>{v.college}</td>
                      <td style={{padding:'14px 18px'}}>
                        <span style={{padding:'4px 12px', borderRadius:'20px', fontSize:'12px', backgroundColor:'#e8f5e9', color:'#1a5c1a', fontWeight:'700'}}>{v.reason}</span>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        <span style={{padding:'4px 12px', borderRadius:'20px', fontSize:'12px', backgroundColor: v.isEmployee ? '#fffde7' : '#e8f0fe', color: v.isEmployee ? '#c8a000' : '#1a73e8', fontWeight:'700'}}>
                          {v.isEmployee ? 'Employee' : 'Student'}
                        </span>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        {v.timestamp?.toDate ? (
                          <div>
                            <div style={{color:'#333', fontWeight:'600', fontSize:'13px'}}>
                              {v.timestamp.toDate().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
                            </div>
                            <div style={{color:'#aaa', fontSize:'11px', marginTop:'2px'}}>
                              {v.timestamp.toDate().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                            </div>
                          </div>
                        ) : ''}
                      </td>
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
            <div style={{marginBottom:'24px'}}>
              <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'22px', fontWeight:'800'}}>Manage Users</h2>
              <p style={{color:'#888', margin:0, fontSize:'13px'}}>{users.length} registered users</p>
            </div>
            <div style={{backgroundColor:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                <thead>
                  <tr style={{background:'linear-gradient(135deg, #1a5c1a 0%, #0d3d0d 100%)'}}>
                    {['Name','Email','Role','Status','Action'].map(h => (
                      <th key={h} style={{padding:'16px 18px', textAlign:'left', color:'white', fontWeight:'700', fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{backgroundColor: i % 2 === 0 ? 'white' : '#fafafa', borderBottom:'1px solid #f0f0f0', transition:'all 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7f0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa'}>
                      <td style={{padding:'14px 18px', fontWeight:'700', color:'#222'}}>{u.name}</td>
                      <td style={{padding:'14px 18px', color:'#888', fontSize:'12px'}}>{u.email}</td>
                      <td style={{padding:'14px 18px'}}>
                        <span style={{padding:'4px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'700', backgroundColor: u.role === 'admin' ? '#e8f5e9' : '#e8f0fe', color: u.role === 'admin' ? '#1a5c1a' : '#1a73e8'}}>{u.role}</span>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        <span style={{padding:'4px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'700', backgroundColor: u.isBlocked ? '#fce8e6' : '#e8f5e9', color: u.isBlocked ? '#c0392b' : '#1a5c1a'}}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{padding:'14px 18px'}}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBlock(u.id, u.isBlocked)}
                            onMouseEnter={e => { e.currentTarget.style.opacity='0.85'; e.currentTarget.style.transform='translateY(-2px)' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}
                            style={{padding:'7px 18px', backgroundColor: u.isBlocked ? '#1a5c1a' : '#c0392b', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'700', transition:'all 0.2s'}}>
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            <div style={{marginBottom:'24px'}}>
              <h2 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'22px', fontWeight:'800'}}>My Profile</h2>
              <p style={{color:'#888', margin:0, fontSize:'13px'}}>View and edit your admin profile information</p>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'24px', flexWrap:'wrap'}}>

              {/* Profile Card */}
              <div style={{backgroundColor:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'32px', textAlign:'center', borderTop:'4px solid #1a5c1a'}}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{width:'100px', height:'100px', borderRadius:'50%', objectFit:'cover', border:'3px solid #1a5c1a', marginBottom:'16px'}}/>
                ) : (
                  <div style={{width:'100px', height:'100px', borderRadius:'50%', backgroundColor:'#1a5c1a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'3px solid #144d14'}}>
                    <span style={{color:'white', fontSize:'36px', fontWeight:'700'}}>{user?.displayName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                <h3 style={{color:'#1a5c1a', margin:'0 0 4px', fontSize:'18px', fontWeight:'800'}}>{adminProfile?.name || user?.displayName}</h3>
                <p style={{color:'#888', fontSize:'13px', margin:'0 0 8px'}}>{user?.email}</p>
                <div style={{display:'inline-block', backgroundColor:'#e8f5e9', color:'#1a5c1a', fontSize:'12px', fontWeight:'700', padding:'4px 16px', borderRadius:'20px', marginBottom:'16px'}}>
                  Administrator
                </div>
                <div style={{borderTop:'1px solid #f0f0f0', paddingTop:'16px', textAlign:'left'}}>
                  {adminProfile?.adminType === 'student' ? (
                    <>
                      {adminProfile?.studentId && <p style={{margin:'0 0 8px', fontSize:'13px', color:'#555'}}>🪪 <strong>Student ID:</strong> {adminProfile.studentId}</p>}
                      {adminProfile?.program && <p style={{margin:'0 0 8px', fontSize:'13px', color:'#555'}}>📚 <strong>Program:</strong> {adminProfile.program}</p>}
                      {adminProfile?.college && <p style={{margin:'0', fontSize:'13px', color:'#555'}}>🏫 <strong>College:</strong> {adminProfile.college}</p>}
                    </>
                  ) : (
                    <>
                      {adminProfile?.employeeId && <p style={{margin:'0 0 8px', fontSize:'13px', color:'#555'}}>🪪 <strong>Employee ID:</strong> {adminProfile.employeeId}</p>}
                      {adminProfile?.position && <p style={{margin:'0 0 8px', fontSize:'13px', color:'#555'}}>💼 <strong>Position:</strong> {adminProfile.position}</p>}
                      {adminProfile?.department && <p style={{margin:'0', fontSize:'13px', color:'#555'}}>🏫 <strong>Department:</strong> {adminProfile.department}</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div style={{backgroundColor:'white', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'32px', borderTop:'4px solid #1a5c1a'}}>
                <h3 style={{color:'#1a5c1a', margin:'0 0 20px', fontSize:'16px', fontWeight:'800'}}>Edit Information</h3>

                {/* Type Toggle */}
                <div style={{display:'flex', backgroundColor:'#f4f6f8', borderRadius:'10px', padding:'4px', marginBottom:'24px'}}>
                  <button
                    onClick={() => setEditAdminType('professor')}
                    style={{
                      flex:1, padding:'10px', border:'none', borderRadius:'8px', cursor:'pointer',
                      fontSize:'13px', fontWeight:'600',
                      backgroundColor: editAdminType === 'professor' ? 'white' : 'transparent',
                      color: editAdminType === 'professor' ? '#1a5c1a' : '#666',
                      boxShadow: editAdminType === 'professor' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                    👨‍🏫 Professor / Staff
                  </button>
                  <button
                    onClick={() => setEditAdminType('student')}
                    style={{
                      flex:1, padding:'10px', border:'none', borderRadius:'8px', cursor:'pointer',
                      fontSize:'13px', fontWeight:'600',
                      backgroundColor: editAdminType === 'student' ? 'white' : 'transparent',
                      color: editAdminType === 'student' ? '#1a5c1a' : '#666',
                      boxShadow: editAdminType === 'student' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                    🎓 Student Admin
                  </button>
                </div>

                <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Full Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your full name"
                  style={profileInputStyle}
                  onFocus={handleProfileInputFocus}
                  onBlur={handleProfileInputBlur}
                />

                {editAdminType === 'professor' ? (
                  <>
                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Employee ID <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editEmployeeId} onChange={e => setEditEmployeeId(e.target.value)} placeholder="e.g. EMP-12345" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />

                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Department / College <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editDepartment} onChange={e => setEditDepartment(e.target.value)} placeholder="e.g. CICS, CBA, Library" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />

                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Position <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editPosition} onChange={e => setEditPosition(e.target.value)} placeholder="e.g. Professor, Librarian, Staff" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />
                  </>
                ) : (
                  <>
                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Student ID <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editStudentId} onChange={e => setEditStudentId(e.target.value)} placeholder="12-34567-890" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />

                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>Program <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editProgram} onChange={e => setEditProgram(e.target.value)} placeholder="e.g. BSIT, BSCS" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />

                    <label style={{display:'block', marginBottom:'6px', fontWeight:'600', color:'#333', fontSize:'14px'}}>College <span style={{color:'#aaa', fontWeight:'400', fontSize:'12px'}}>(optional)</span></label>
                    <input value={editCollege} onChange={e => setEditCollege(e.target.value)} placeholder="e.g. CICS, CBA, CEA" style={profileInputStyle} onFocus={handleProfileInputFocus} onBlur={handleProfileInputBlur} />
                  </>
                )}

                {/* Save button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#144d14'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a5c1a'; e.currentTarget.style.transform='translateY(0)' }}
                  style={{
                    padding:'13px 32px', backgroundColor:'#1a5c1a', color:'white',
                    border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'700',
                    cursor:'pointer', transition:'all 0.2s', marginTop:'8px'
                  }}>
                  {profileSaving ? 'Saving...' : '💾 Save Changes'}
                </button>

                {/* Success message */}
                {profileSaved && (
                  <div style={{
                    marginTop:'16px', padding:'12px 16px', backgroundColor:'#e8f5e9',
                    borderRadius:'10px', border:'1px solid #c8e6c9',
                    color:'#1a5c1a', fontSize:'14px', fontWeight:'600'
                  }}>
                    ✅ Profile saved successfully!
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default AdminPage