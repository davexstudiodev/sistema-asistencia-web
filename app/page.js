'use client'

import { useState, useEffect, useMemo } from 'react'
import { Users, UserCheck, Database, Wifi, WifiOff, Plus, Trash2, RefreshCw, Download, Filter, Calendar, Clock, CreditCard, Shield, GraduationCap, BookOpen, Search, ChevronDown, ChevronRight, FileText, School, Edit3, X, Check } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, bySection: [], recent: [] })
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({ uid: '', name: '', grade: '', section: 'A', level: 1 })
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
          setFormData({ uid: p.uid, name: '', grade: '', section: 'A', level: 1 })
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
      const payload = { ...formData }
      // Si es profesor o director, no enviar grado/seccion
      if (payload.level === 2 || payload.level === 3) {
        payload.grade = ''
        payload.section = ''
      }
      const method = editingStudent ? 'PUT' : 'POST'
      if (editingStudent) payload.id = editingStudent.id
      const res = await fetch('/api/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (data.ok) {
        if (!editingStudent) await fetch('/api/pending', { method: 'DELETE' })
        setLastPending('')
        setStatusText(editingStudent ? 'Actualizado' : 'Registrado')
        setStatusType('ok')
        setShowForm(false)
        setEditingStudent(null)
        setFormData({ uid: '', name: '', grade: '', section: 'A', level: 1 })
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
    setFormData({ uid: s.uid, name: s.name, grade: s.grade, section: s.section || 'A', level: s.level || 1 })
    setShowForm(true)
  }

  function toggleSection(key) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Solo alumnos para agrupar por seccion
  const studentsOnly = useMemo(() => students.filter(s => s.level === 1), [students])

  const groupedStudents = useMemo(() => {
    const groups = {}
    studentsOnly.forEach(s => {
      const key = `${s.grade || 'SN'}-${s.section || 'A'}`
      if (!groups[key]) groups[key] = { grade: s.grade || 'SN', section: s.section || 'A', students: [] }
      groups[key].students.push(s)
    })
    return Object.values(groups).sort((a, b) => a.grade.localeCompare(b.grade) || a.section.localeCompare(b.section))
  }, [studentsOnly])

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

  function getLevelText(level) {
    if (level === 3) return 'Director'
    if (level === 2) return 'Profesor'
    return 'Alumno'
  }

  function esc(val) {
    if (!val && val !== 0) return ''
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  function exportCSV(type, data, filename) {
    const SEP = ','
    const NL = '\n'
    let csv = ''

    if (type === 'students') {
      csv += ['No', 'UID', 'Nombre', 'Grado', 'Seccion', 'Nivel'].join(SEP) + NL
      data.forEach((s, i) => {
        csv += [i + 1, esc(s.uid), esc(s.name), esc(s.grade), esc(s.section || 'A'), esc(getLevelText(s.level))].join(SEP) + NL
      })
    } else if (type === 'attendance') {
      csv += ['No', 'Nombre', 'Grado', 'Seccion', 'UID', 'Fecha', 'Hora'].join(SEP) + NL
      data.forEach((a, i) => {
        csv += [i + 1, esc(a.name), esc(a.grade), esc(a.section), esc(a.uid), esc(a.date), esc(a.time)].join(SEP) + NL
      })
    } else if (type === 'libro') {
      const dates = [...new Set(data.map(a => a.date))].sort()
      const header = ['No', 'Alumno', ...dates, 'Asistencias', 'Porcentaje']
      csv += header.join(SEP) + NL

      const byName = {}
      data.forEach(a => {
        if (!byName[a.name]) byName[a.name] = { name: a.name, dates: new Set() }
        byName[a.name].dates.add(a.date)
      })

      Object.values(byName).forEach((s, i) => {
        const row = [i + 1, esc(s.name)]
        dates.forEach(d => row.push(s.dates.has(d) ? 'X' : ''))
        row.push(s.dates.size)
        row.push(Math.round((s.dates.size / dates.length) * 100) + '%')
        csv += row.join(SEP) + NL
      })
    }

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
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

        {/* ========== DASHBOARD ========== */}
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
                <div className="grado">{stats.recent[0].grade} {stats.recent[0].section}</div>
                <div className="hora"><Clock size={14} /> {stats.recent[0].time} - {stats.recent[0].date}</div>
              </div>
            )}

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
                        <div className="section-bar">
                          <div className="section-fill" style={{width: `${pct}%`}}></div>
                        </div>
                        <div className="section-count">{s.asistieron}/{s.total} ({pct}%)</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty"><p>No hay datos</p></div>
              )}
            </div>

            <div className="card">
              <h2><Users size={18} /> Acciones</h2>
              <div className="actions-grid">
                <button className="btn btn-success" onClick={() => { setEditingStudent(null); setFormData({ uid: '', name: '', grade: '', section: 'A', level: 1 }); setShowForm(!showForm); }}>
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
              {editingStudent ? 'EDITAR' : lastPending ? 'NUEVA TARJETA' : 'REGISTRAR'}
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
                    <option value="3">Director</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>NOMBRE COMPLETO</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan Perez" required />
              </div>
              {formData.level === 1 && (
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
              )}
              <button type="submit" className="btn btn-success">
                <Check size={16} /> {editingStudent ? 'ACTUALIZAR' : 'GUARDAR'}
              </button>
            </form>
          </div>
        )}

        {/* ========== ALUMNOS ========== */}
        {activeTab === 'students' && (
          <div className="card">
            <h2><Users size={18} /> ALUMNOS POR SECCION ({studentsOnly.length})</h2>
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
                      <th style={{width: '70px'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.filter(s => s.level === 1).map((s, i) => (
                      <tr key={s.id}>
                        <td className="cell-num">{i + 1}</td>
                        <td className="cell-uid">{s.uid}</td>
                        <td className="cell-name">{s.name}</td>
                        <td>{s.grade}</td>
                        <td><span className="section-badge">{s.section || 'A'}</span></td>
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

        {/* ========== HISTORIAL ========== */}
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
                        <span className="group-count">{group.records.length}</span>
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

        {/* ========== EXPORTAR ========== */}
        {activeTab === 'exports' && (
          <>
            <div className="card">
              <h2><Download size={18} /> EXPORTAR ALUMNOS</h2>
              <button className="btn btn-outline" style={{width: '100%'}} onClick={() => exportCSV('students', students.filter(s => s.level === 1), 'alumnos_' + new Date().toISOString().split('T')[0] + '.csv')}>
                <FileText size={16} /> Lista de alumnos (CSV)
              </button>
            </div>

            <div className="card">
              <h2><FileText size={18} /> LIBROS POR SECCION</h2>
              <p style={{color: '#71717a', fontSize: '12px', marginBottom: '16px'}}>Libro de asistencia con marca X por dia</p>
              {groupedStudents.length === 0 ? (
                <div className="empty"><p>No hay secciones</p></div>
              ) : (
                <div className="export-grid-2">
                  {groupedStudents.map(group => {
                    const sectionAtt = attendance.filter(a => a.grade === group.grade && (a.section || 'A') === group.section)
                    return (
                      <button key={`${group.grade}-${group.section}`} className="btn btn-outline" onClick={() => exportCSV('libro', sectionAtt, `libro_${group.grade}_${group.section}_${new Date().toISOString().split('T')[0]}.csv`)}>
                        <BookOpen size={14} /> {group.grade} {group.section}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h2><Download size={18} /> EXPORTAR TODO</h2>
              <div className="actions-grid">
                <button className="btn btn-outline" onClick={() => exportCSV('attendance', attendance, 'historial_total_' + new Date().toISOString().split('T')[0] + '.csv')}>
                  <Download size={14} /> Completo
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
