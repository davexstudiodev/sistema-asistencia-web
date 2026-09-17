'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, UserCheck, Database, Wifi, WifiOff, Plus, Trash2, RefreshCw, Download, Filter, Calendar, Clock, CreditCard, Shield, GraduationCap, BookOpen, Search, ChevronDown, ChevronRight, FileText, School, Edit3, X, Check } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, bySection: [], recent: [], teachers: [] })
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({ uid: '', name: '', grade: '', section: 'A', level: 1, teacher: '' })
  const [filter, setFilter] = useState('all')
  const [statusText, setStatusText] = useState('Conectando...')
  const [statusType, setStatusType] = useState('info')
  const [lastPending, setLastPending] = useState('')
  const [searchStudent, setSearchStudent] = useState('')
  const [searchAttendance, setSearchAttendance] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [activeTab, setActiveTab] = useState('dashboard')

  const GRADES = ['1ro', '2do', '3ro', '4to', '5to', '6to']
  const SECTIONS = ['A', 'B', 'C', 'D']

  async function fetchData() {
    try {
      const [statsRes, studentsRes, attendRes, pendingRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/students'),
        fetch('/api/attendance'),
        fetch('/api/pending')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (attendRes.ok) setAttendance(await attendRes.json())

      if (pendingRes.ok) {
        const p = await pendingRes.json()
        if (p.pending && p.uid !== lastPending) {
          setLastPending(p.uid)
          setFormData({ uid: p.uid, name: '', grade: '', section: 'A', level: 1, teacher: '' })
          setShowForm(true)
          setStatusText('Nueva tarjeta detectada')
          setStatusType('waiting')
          return
        }
      }

      setStatusText('Sistema listo')
      setStatusType('ok')
    } catch (e) {
      setStatusText('Error de conexion')
      setStatusType('error')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [lastPending])

  async function handleRegister(e) {
    e.preventDefault()
    try {
      const method = editingStudent ? 'PUT' : 'POST'
      const body = editingStudent ? { ...formData, id: editingStudent.id } : formData
      const res = await fetch('/api/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.ok) {
        if (!editingStudent) await fetch('/api/pending', { method: 'DELETE' })
        setLastPending('')
        setStatusText(editingStudent ? 'Alumno actualizado' : 'Alumno registrado')
        setStatusType('ok')
        setShowForm(false)
        setEditingStudent(null)
        setFormData({ uid: '', name: '', grade: '', section: 'A', level: 1, teacher: '' })
        fetchData()
      } else {
        setStatusText(data.message)
        setStatusType('error')
      }
    } catch (e) {
      setStatusText('Error al guardar')
      setStatusType('error')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm('Eliminar a ' + name + '?')) return
    await fetch('/api/students?id=' + id, { method: 'DELETE' })
    fetchData()
  }

  function handleEdit(s) {
    setEditingStudent(s)
    setFormData({ uid: s.uid, name: s.name, grade: s.grade, section: s.section || 'A', level: s.level || 1, teacher: s.teacher || '' })
    setShowForm(true)
  }

  function toggleSection(key) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Agrupar alumnos por grado/seccion
  const groupedStudents = useMemo(() => {
    const groups = {}
    students.forEach(s => {
      const key = `${s.grade}-${s.section || 'A'}`
      if (!groups[key]) groups[key] = { grade: s.grade, section: s.section || 'A', teacher: s.teacher || '', students: [] }
      groups[key].students.push(s)
    })
    return Object.values(groups).sort((a, b) => a.grade.localeCompare(b.grade) || a.section.localeCompare(b.section))
  }, [students])

  // Agrupar asistencia por grado/seccion
  const groupedAttendance = useMemo(() => {
    const filtered = attendance.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchAttendance.toLowerCase()) || (a.grade && a.grade.toLowerCase().includes(searchAttendance.toLowerCase()))
      if (filter === 'today') return matchSearch && a.date === new Date().toISOString().split('T')[0]
      return matchSearch
    })
    const groups = {}
    filtered.forEach(a => {
      const key = `${a.grade || 'N/A'}-${a.section || 'A'}`
      if (!groups[key]) groups[key] = { grade: a.grade, section: a.section || 'A', records: [] }
      groups[key].records.push(a)
    })
    return Object.values(groups).sort((a, b) => (a.grade || '').localeCompare(b.grade || '') || a.section.localeCompare(b.section))
  }, [attendance, filter, searchAttendance])

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.uid.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.grade && s.grade.toLowerCase().includes(searchStudent.toLowerCase()))
  )

  // CSV EXPORTS
  function exportCSV(type, data, filename) {
    const BOM = '\uFEFF'
    let csv = BOM + 'No.,'
    const today = new Date().toISOString().split('T')[0]

    if (type === 'students') {
      csv += 'UID,Nombre,Grado,Seccion,Nivel,Profesor,Fecha Registro\n'
      data.forEach((s, i) => {
        csv += `${i + 1},"${s.uid}","${s.name}","${s.grade}","${s.section || 'A'}","${s.level === 3 ? 'Admin' : s.level === 2 ? 'Profesor' : 'Alumno'}","${s.teacher || ''}","${s.created_at || ''}"\n`
      })
    } else if (type === 'attendance') {
      csv += 'Nombre,Grado,Seccion,Profesor,UID,Fecha,Hora\n'
      data.forEach((a, i) => {
        csv += `${i + 1},"${a.name}","${a.grade || ''}","${a.section || ''}","${a.teacher || ''}","${a.uid}","${a.date}","${a.time}"\n`
      })
    } else if (type === 'libro') {
      // Formato libro de asistencia escolar
      csv += 'Alumno,'
      const dates = [...new Set(data.map(a => a.date))].sort()
      dates.forEach(d => { csv += `${d},` })
      csv += 'Total Asistencias,Porcentaje\n'
      
      const studentsByName = {}
      data.forEach(a => {
        if (!studentsByName[a.name]) studentsByName[a.name] = { name: a.name, grade: a.grade, section: a.section, teacher: a.teacher, dates: new Set() }
        studentsByName[a.name].dates.add(a.date)
      })
      
      Object.values(studentsByName).forEach((s, i) => {
        csv += `${i + 1},"${s.name}","${s.grade || ''}","${s.section || ''}","${s.teacher || ''}",`
        dates.forEach(d => { csv += `${s.dates.has(d) ? 'X' : ''},` })
        const pct = dates.length > 0 ? Math.round((s.dates.size / dates.length) * 100) : 0
        csv += `${s.dates.size},${pct}%\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function getLevelIcon(level) {
    if (level === 3) return <Shield size={12} />
    if (level === 2) return <BookOpen size={12} />
    return <GraduationCap size={12} />
  }

  function getLevelText(level) {
    if (level === 3) return 'Admin'
    if (level === 2) return 'Profesor'
    return 'Alumno'
  }

  return (
    <>
      <div className="header">
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
          <School size={28} color="#00d4ff" />
          <div>
            <h1>SISTEMA DE ASISTENCIA</h1>
            <p>Control Escolar por RFID</p>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={`status status-${statusType}`}>
          {statusType === 'ok' && <Wifi size={16} />}
          {statusType === 'error' && <WifiOff size={16} />}
          {statusText}
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Database size={16} /> Panel
          </button>
          <button className={`tab ${activeTab === 'students' ? 'tab-active' : ''}`} onClick={() => setActiveTab('students')}>
            <Users size={16} /> Alumnos
          </button>
          <button className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>
            <Calendar size={16} /> Historial
          </button>
          <button className={`tab ${activeTab === 'exports' ? 'tab-active' : ''}`} onClick={() => setActiveTab('exports')}>
            <Download size={16} /> Exportar
          </button>
        </div>

        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats">
              <div className="stat-box stat-blue">
                <div className="stat-icon"><Users size={22} /></div>
                <div className="number">{stats.totalStudents || 0}</div>
                <div className="label">Alumnos</div>
              </div>
              <div className="stat-box stat-green">
                <div className="stat-icon"><UserCheck size={22} /></div>
                <div className="number">{stats.todayAttendance || 0}</div>
                <div className="label">Hoy</div>
              </div>
              <div className="stat-box stat-yellow">
                <div className="stat-icon"><Database size={22} /></div>
                <div className="number">{stats.totalRecords || 0}</div>
                <div className="label">Total</div>
              </div>
            </div>

            {stats.recent && stats.recent.length > 0 && (
              <div className="card ultimo-marcado">
                <div className="ultimo-label">Ultimo registro</div>
                <div className="nombre">{stats.recent[0].name}</div>
                <div className="grado">{stats.recent[0].grade} {stats.recent[0].section} - {stats.recent[0].teacher || ''}</div>
                <div className="hora"><Clock size={14} /> {stats.recent[0].time} - {stats.recent[0].date}</div>
              </div>
            )}

            {/* Asistencia por seccion hoy */}
            <div className="card">
              <h2><FileText size={18} /> Asistencia por Seccion (Hoy)</h2>
              {stats.bySection && stats.bySection.length > 0 ? (
                <div className="section-grid">
                  {stats.bySection.map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.asistieron / s.total) * 100) : 0
                    return (
                      <div key={i} className="section-card">
                        <div className="section-header">
                          <span className="section-grade">{s.grade}</span>
                          <span className="section-letter">{s.section}</span>
                        </div>
                        <div className="section-teacher">{s.teacher || 'Sin profesor'}</div>
                        <div className="section-bar">
                          <div className="section-fill" style={{width: `${pct}%`}}></div>
                        </div>
                        <div className="section-count">{s.asistieron}/{s.total} ({pct}%)</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty"><p>No hay datos de secciones</p></div>
              )}
            </div>

            <div className="card">
              <h2><Users size={18} /> Acciones</h2>
              <div className="actions-grid">
                <button className="btn btn-success" onClick={() => { setEditingStudent(null); setFormData({ uid: '', name: '', grade: '', section: 'A', level: 1, teacher: '' }); setShowForm(!showForm); }}>
                  <Plus size={16} /> {showForm ? 'CANCELAR' : 'REGISTRAR'}
                </button>
                <button className="btn btn-primary" onClick={fetchData}>
                  <RefreshCw size={16} /> ACTUALIZAR
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========== FORMULARIO ========== */}
        {showForm && (
          <div className="card card-highlight">
            <h2>
              <CreditCard size={18} />
              {editingStudent ? 'EDITAR ALUMNO' : lastPending ? 'NUEVA TARJETA' : 'REGISTRAR ALUMNO'}
              <button className="btn-icon" style={{marginLeft: 'auto'}} onClick={() => { setShowForm(false); setEditingStudent(null); }}><X size={18} /></button>
            </h2>
            <form onSubmit={handleRegister}>
              <div className="form-row">
                <div className="form-group">
                  <label>UID TARJETA</label>
                  <input type="text" value={formData.uid} onChange={(e) => setFormData({...formData, uid: e.target.value})} placeholder="Auto" required style={{fontFamily: 'monospace'}} />
                </div>
                <div className="form-group">
                  <label>NIVEL</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}>
                    <option value="1">Alumno</option>
                    <option value="2">Profesor</option>
                    <option value="3">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>NOMBRE COMPLETO</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan Perez" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>GRADO</label>
                  <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} required>
                    <option value="">Seleccionar</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>SECCION</label>
                  <select value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})}>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>PROFESOR RESPONSABLE</label>
                <input type="text" value={formData.teacher} onChange={(e) => setFormData({...formData, teacher: e.target.value})} placeholder="Ej: Maria Garcia" />
              </div>
              <button type="submit" className="btn btn-success">
                <Check size={16} /> {editingStudent ? 'ACTUALIZAR' : 'GUARDAR'}
              </button>
            </form>
          </div>
        )}

        {/* ========== STUDENTS TAB ========== */}
        {activeTab === 'students' && (
          <div className="card">
            <h2><Users size={18} /> ALUMNOS POR SECCION ({students.length})</h2>
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Buscar por nombre, UID o grado..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} />
            </div>

            {searchStudent ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{width: '36px'}}>#</th>
                      <th>UID</th>
                  <th>Nombre</th>
                      <th>Grado</th>
                      <th>Seccion</th>
                      <th>Profesor</th>
                      <th>Nivel</th>
                      <th style={{width: '70px'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={s.id}>
                        <td className="cell-num">{i + 1}</td>
                        <td className="cell-uid">{s.uid}</td>
                        <td className="cell-name">{s.name}</td>
                        <td>{s.grade}</td>
                        <td><span className="section-badge">{s.section || 'A'}</span></td>
                        <td className="cell-teacher">{s.teacher || '-'}</td>
                        <td><span className={s.level === 3 ? 'badge badge-admin' : s.level === 2 ? 'badge badge-profesor' : 'badge badge-alumno'}>{getLevelIcon(s.level)} {getLevelText(s.level)}</span></td>
                        <td>
                          <div style={{display: 'flex', gap: '4px'}}>
                            <button className="btn-icon btn-edit" onClick={() => handleEdit(s)}><Edit3 size={14} /></button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(s.id, s.name)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : groupedStudents.length === 0 ? (
              <div className="empty"><Users size={40} /><p>No hay alumnos registrados</p></div>
            ) : (
              groupedStudents.map(group => {
                const key = `${group.grade}-${group.section}`
                const isExpanded = expandedSections[key] !== false
                const presentToday = group.students.filter(s => attendance.some(a => a.student_id === s.id && a.date === new Date().toISOString().split('T')[0])).length
                const pct = group.students.length > 0 ? Math.round((presentToday / group.students.length) * 100) : 0

                return (
                  <div key={key} className="group-card">
                    <div className="group-header" onClick={() => toggleSection(key)}>
                      <div className="group-left">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="group-grade">{group.grade}</span>
                        <span className="group-section">{group.section}</span>
                        <span className="group-teacher">{group.teacher || 'Sin profesor'}</span>
                      </div>
                      <div className="group-right">
                        <span className="group-count">{presentToday}/{group.students.length}</span>
                        <div className="mini-bar"><div className="mini-fill" style={{width: `${pct}%`}}></div></div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="group-body">
                        <table>
                          <thead>
                            <tr>
                              <th style={{width: '36px'}}>#</th>
                              <th>UID</th>
                              <th>Nombre</th>
                              <th style={{width: '70px'}}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.students.map((s, i) => (
                              <tr key={s.id}>
                                <td className="cell-num">{i + 1}</td>
                                <td className="cell-uid">{s.uid}</td>
                                <td className="cell-name">{s.name}</td>
                                <td>
                                  <div style={{display: 'flex', gap: '4px'}}>
                                    <button className="btn-icon btn-edit" onClick={() => handleEdit(s)}><Edit3 size={14} /></button>
                                    <button className="btn-icon btn-delete" onClick={() => handleDelete(s.id, s.name)}><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ========== HISTORY TAB ========== */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header-row">
              <h2><Calendar size={18} /> HISTORIAL</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setFilter(filter === 'today' ? 'all' : 'today')}>
                <Filter size={14} /> {filter === 'today' ? 'TODOS' : 'HOY'}
              </button>
            </div>
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Buscar por nombre o grado..." value={searchAttendance} onChange={(e) => setSearchAttendance(e.target.value)} />
            </div>

            {groupedAttendance.length === 0 ? (
              <div className="empty"><Calendar size={40} /><p>No hay registros</p></div>
            ) : (
              groupedAttendance.map(group => {
                const key = `${group.grade || 'N/A'}-${group.section}`
                const isExpanded = expandedSections[key] !== false
                return (
                  <div key={key} className="group-card">
                    <div className="group-header" onClick={() => toggleSection(key)}>
                      <div className="group-left">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span className="group-grade">{group.grade || 'N/A'}</span>
                        <span className="group-section">{group.section}</span>
                      </div>
                      <div className="group-right">
                        <span className="group-count">{group.records.length} registros</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="group-body">
                        <table>
                          <thead>
                            <tr>
                              <th style={{width: '36px'}}>#</th>
                              <th>Nombre</th>
                              <th>Fecha</th>
                              <th>Hora</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.records.slice(0, 50).map((a, i) => (
                              <tr key={a.id}>
                                <td className="cell-num">{i + 1}</td>
                                <td className="cell-name">{a.name}</td>
                                <td className="cell-date">{a.date}</td>
                                <td className="cell-time">{a.time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ========== EXPORTS TAB ========== */}
        {activeTab === 'exports' && (
          <>
            <div className="card">
              <h2><Download size={18} /> EXPORTAR ALUMNOS</h2>
              <button className="btn btn-outline" style={{width: '100%'}} onClick={() => exportCSV('students', students, 'alumnos_' + new Date().toISOString().split('T')[0] + '.csv')}>
                <FileText size={16} /> Lista de alumnos (CSV)
              </button>
            </div>

            <div className="card">
              <h2><FileText size={18} /> LIBROS DE ASISTENCIA POR SECCION</h2>
              <p style={{color: '#71717a', fontSize: '12px', marginBottom: '16px'}}>Exportar registro de asistencia agrupado por grado/seccion</p>
              {groupedStudents.length === 0 ? (
                <div className="empty"><p>No hay secciones</p></div>
              ) : (
                <div className="export-grid-2">
                  {groupedStudents.map(group => {
                    const key = `${group.grade}-${group.section}`
                    const sectionAttendance = attendance.filter(a => a.grade === group.grade && (a.section || 'A') === group.section)
                    return (
                      <button key={key} className="btn btn-outline" onClick={() => exportCSV('libro', sectionAttendance, `libro_${group.grade}_${group.section}_${new Date().toISOString().split('T')[0]}.csv`)}>
                        <BookOpen size={14} /> {group.grade} {group.section}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h2><GraduationCap size={18} /> EXPORTAR POR PROFESOR</h2>
              <p style={{color: '#71717a', fontSize: '12px', marginBottom: '16px'}}>Asistencia de los alumnos de cada profesor</p>
              {stats.teachers && stats.teachers.length > 0 ? (
                <div className="export-grid-2">
                  {stats.teachers.map(teacher => {
                    const teacherStudents = students.filter(s => s.teacher === teacher)
                    const teacherAttendance = attendance.filter(a => a.teacher === teacher)
                    return (
                      <button key={teacher} className="btn btn-outline" onClick={() => exportCSV('libro', teacherAttendance, `profesor_${teacher.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)}>
                        <BookOpen size={14} /> {teacher}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="empty"><p>No hay profesores asignados</p></div>
              )}
            </div>

            <div className="card">
              <h2><Download size={18} /> EXPORTAR TODO</h2>
              <div className="actions-grid">
                <button className="btn btn-outline" onClick={() => exportCSV('attendance', attendance, 'asistencia_total_' + new Date().toISOString().split('T')[0] + '.csv')}>
                  <Download size={14} /> Historial completo
                </button>
                <button className="btn btn-outline" onClick={() => exportCSV('attendance', attendance.filter(a => a.date === new Date().toISOString().split('T')[0]), 'asistencia_hoy_' + new Date().toISOString().split('T')[0] + '.csv')}>
                  <Download size={14} /> Solo hoy
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
