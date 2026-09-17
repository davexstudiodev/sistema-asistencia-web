'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, Database, Wifi, WifiOff, Plus, Trash2, RefreshCw, Download, Filter, Calendar, Clock, CreditCard, Shield, GraduationCap, BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, recent: [] })
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ uid: '', name: '', grade: '', level: 1 })
  const [filter, setFilter] = useState('all')
  const [statusText, setStatusText] = useState('Conectando...')
  const [statusType, setStatusType] = useState('info')
  const [lastPending, setLastPending] = useState('')
  const [searchStudent, setSearchStudent] = useState('')
  const [searchAttendance, setSearchAttendance] = useState('')

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
          setFormData({ uid: p.uid, name: '', grade: '', level: 1 })
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
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (data.ok) {
        await fetch('/api/pending', { method: 'DELETE' })
        setLastPending('')
        setStatusText('Alumno registrado')
        setStatusType('ok')
        setShowForm(false)
        setFormData({ uid: '', name: '', grade: '', level: 1 })
        fetchData()
      } else {
        setStatusText(data.message)
        setStatusType('error')
      }
    } catch (e) {
      setStatusText('Error al registrar')
      setStatusType('error')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm('Eliminar a ' + name + '?')) return
    await fetch('/api/students?id=' + id, { method: 'DELETE' })
    fetchData()
  }

  function exportCSV(type) {
    const BOM = '\uFEFF'
    let csv = BOM
    let filename = ''
    const today = new Date().toISOString().split('T')[0]

    if (type === 'students') {
      csv += 'No.,UID Tarjeta,Nombre Completo,Grado / Seccion,Nivel,Fecha Registro\n'
      students.forEach((s, i) => {
        csv += `${i + 1},"${s.uid}","${s.name}","${s.grade || ''}","${s.level === 3 ? 'Admin' : s.level === 2 ? 'Profesor' : 'Alumno'}","${s.created_at || ''}"\n`
      })
      filename = 'alumnos_' + today + '.csv'
    } else if (type === 'attendance-today') {
      csv += 'No.,Nombre,Grado,Nivel,UID,Fecha,Hora\n'
      const todayRecords = attendance.filter(a => a.date === today)
      todayRecords.forEach((a, i) => {
        csv += `${i + 1},"${a.name}","${a.grade || ''}","${a.level === 3 ? 'Admin' : a.level === 2 ? 'Profesor' : 'Alumno'}","${a.uid}","${a.date}","${a.time}"\n`
      })
      filename = 'asistencia_hoy_' + today + '.csv'
    } else {
      csv += 'No.,Nombre,Grado,Nivel,UID,Fecha,Hora\n'
      attendance.forEach((a, i) => {
        csv += `${i + 1},"${a.name}","${a.grade || ''}","${a.level === 3 ? 'Admin' : a.level === 2 ? 'Profesor' : 'Alumno'}","${a.uid}","${a.date}","${a.time}"\n`
      })
      filename = 'asistencia_total_' + today + '.csv'
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

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.uid.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (s.grade && s.grade.toLowerCase().includes(searchStudent.toLowerCase()))
  )

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchAttendance.toLowerCase()) ||
      (a.grade && a.grade.toLowerCase().includes(searchAttendance.toLowerCase()))
    if (filter === 'today') {
      return matchesSearch && a.date === new Date().toISOString().split('T')[0]
    }
    return matchesSearch
  })

  return (
    <>
      <div className="header">
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'}}>
          <CreditCard size={28} color="#00d4ff" />
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
            <div className="grado">{stats.recent[0].grade || ''}</div>
            <div className="hora">
              <Clock size={14} />
              {stats.recent[0].time} - {stats.recent[0].date}
            </div>
          </div>
        )}

        <div className="card">
          <h2>Acciones</h2>
          <div className="actions-grid">
            <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} /> {showForm ? 'CANCELAR' : 'REGISTRAR'}
            </button>
            <button className="btn btn-primary" onClick={fetchData}>
              <RefreshCw size={16} /> ACTUALIZAR
            </button>
          </div>
          <div className="export-grid">
            <button className="btn btn-outline" onClick={() => exportCSV('students')}>
              <Download size={14} /> Alumnos
            </button>
            <button className="btn btn-outline" onClick={() => exportCSV('attendance-today')}>
              <Download size={14} /> Asistencia Hoy
            </button>
            <button className="btn btn-outline" onClick={() => exportCSV('all')}>
              <Download size={14} /> Todo
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card card-highlight">
            <h2>
              <CreditCard size={18} />
              {lastPending ? 'NUEVA TARJETA DETECTADA' : 'REGISTRAR ALUMNO'}
            </h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>UID TARJETA</label>
                <input
                  type="text"
                  value={formData.uid}
                  onChange={(e) => setFormData({...formData, uid: e.target.value})}
                  placeholder="Se llena automaticamente"
                  required
                  style={{fontFamily: 'monospace', letterSpacing: '2px'}}
                />
              </div>
              <div className="form-group">
                <label>NOMBRE COMPLETO</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Juan Perez"
                  required
                />
              </div>
              <div className="form-group">
                <label>GRADO / SECCION</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  placeholder="Ej: 5to A"
                  required
                />
              </div>
              <div className="form-group">
                <label>NIVEL</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                >
                  <option value="1">Alumno</option>
                  <option value="2">Profesor</option>
                  <option value="3">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                GUARDAR EN BASE DE DATOS
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h2>
            <Users size={18} />
            ALUMNOS ({students.length})
          </h2>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, UID o grado..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
            />
          </div>
          {filteredStudents.length === 0 ? (
            <div className="empty">
              <Users size={40} />
              <p>{searchStudent ? 'No se encontraron resultados' : 'No hay alumnos registrados'}</p>
              {!searchStudent && <p className="empty-sub">Acérque una tarjeta al lector para comenzar</p>}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width: '40px'}}>#</th>
                    <th>UID</th>
                    <th>Nombre</th>
                    <th>Grado</th>
                    <th>Nivel</th>
                    <th style={{width: '40px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id}>
                      <td className="cell-num">{i + 1}</td>
                      <td className="cell-uid">{s.uid}</td>
                      <td className="cell-name">{s.name}</td>
                      <td>{s.grade}</td>
                      <td>
                        <span className={s.level === 3 ? 'badge badge-admin' : s.level === 2 ? 'badge badge-profesor' : 'badge badge-alumno'}>
                          {getLevelIcon(s.level)} {getLevelText(s.level)}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(s.id, s.name)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header-row">
            <h2>
              <Calendar size={18} />
              HISTORIAL ({filteredAttendance.length})
            </h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setFilter(filter === 'today' ? 'all' : 'today')}
            >
              <Filter size={14} />
              {filter === 'today' ? 'VER TODOS' : 'SOLO HOY'}
            </button>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o grado..."
              value={searchAttendance}
              onChange={(e) => setSearchAttendance(e.target.value)}
            />
          </div>
          {filteredAttendance.length === 0 ? (
            <div className="empty">
              <Calendar size={40} />
              <p>{searchAttendance ? 'No se encontraron resultados' : 'No hay registros'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width: '40px'}}>#</th>
                    <th>Nombre</th>
                    <th>Grado</th>
                    <th>Nivel</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.slice(0, 100).map((a, i) => (
                    <tr key={a.id}>
                      <td className="cell-num">{i + 1}</td>
                      <td className="cell-name">{a.name}</td>
                      <td>{a.grade || '-'}</td>
                      <td>
                        <span className={a.level === 3 ? 'badge badge-admin' : a.level === 2 ? 'badge badge-profesor' : 'badge badge-alumno'}>
                          {getLevelIcon(a.level)} {getLevelText(a.level)}
                        </span>
                      </td>
                      <td className="cell-date">{a.date}</td>
                      <td className="cell-time">{a.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
