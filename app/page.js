'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, Database, Wifi, WifiOff, Plus, Trash2, RefreshCw, Download, Filter, Calendar, Clock, CreditCard, Shield, GraduationCap, BookOpen } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

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
          setLoading(false)
          return
        }
      }

      setStatusText('Sistema listo')
      setStatusType('ok')
      setLoading(false)
    } catch (e) {
      setStatusText('Error de conexion')
      setStatusType('error')
      setLoading(false)
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

  function exportCSV() {
    let csv = 'Nombre,UID,Grado,Nivel,Fecha,Hora\n'
    attendance.forEach(a => {
      csv += `"${a.name}","${a.uid}","${a.grade || ''}","${a.level || ''}","${a.date}","${a.time}"\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asistencia_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  function getLevelIcon(level) {
    if (level === 3) return <Shield size={14} />
    if (level === 2) return <BookOpen size={14} />
    return <GraduationCap size={14} />
  }

  function getLevelText(level) {
    if (level === 3) return 'Admin'
    if (level === 2) return 'Profesor'
    return 'Alumno'
  }

  const filtered = filter === 'today'
    ? attendance.filter(a => a.date === new Date().toISOString().split('T')[0])
    : attendance

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
          {statusType === 'ok' && <Wifi size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />}
          {statusType === 'error' && <WifiOff size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />}
          {statusText}
        </div>

        <div className="stats">
          <div className="stat-box">
            <Users size={24} color="#00d4ff" style={{margin: '0 auto 8px'}} />
            <div className="number">{stats.totalStudents || 0}</div>
            <div className="label">Alumnos</div>
          </div>
          <div className="stat-box">
            <UserCheck size={24} color="#00e676" style={{margin: '0 auto 8px'}} />
            <div className="number">{stats.todayAttendance || 0}</div>
            <div className="label">Hoy</div>
          </div>
          <div className="stat-box">
            <Database size={24} color="#ffc107" style={{margin: '0 auto 8px'}} />
            <div className="number">{stats.totalRecords || 0}</div>
            <div className="label">Total</div>
          </div>
        </div>

        {stats.recent && stats.recent.length > 0 && (
          <div className="ultimo-marcado">
            <p style={{color: '#666', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'}}>Ultimo registro</p>
            <div className="nombre">{stats.recent[0].name}</div>
            <div className="grado">{stats.recent[0].grade || ''}</div>
            <div className="hora">
              <Clock size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}} />
              {stats.recent[0].time} - {stats.recent[0].date}
            </div>
          </div>
        )}

        <div className="card">
          <h2>Acciones</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
            <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
              <Plus size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '6px'}} />
              {showForm ? 'CANCELAR' : 'REGISTRAR'}
            </button>
            <button className="btn btn-primary" onClick={fetchData}>
              <RefreshCw size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '6px'}} />
              ACTUALIZAR
            </button>
          </div>
          <button className="btn btn-warning" onClick={exportCSV} style={{marginTop: '8px'}}>
            <Download size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '6px'}} />
            EXPORTAR CSV
          </button>
        </div>

        {showForm && (
          <div className="card" style={{border: '1px solid #00d4ff'}}>
            <h2>
              <CreditCard size={18} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
              {lastPending ? 'NUEVA TARJETA' : 'REGISTRAR ALUMNO'}
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
            <Users size={18} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
            ALUMNOS ({students.length})
          </h2>
          {students.length === 0 ? (
            <div className="empty">
              <Users size={40} color="#333" />
              <p style={{marginTop: '10px'}}>No hay alumnos registrados</p>
              <p style={{fontSize: '12px', color: '#555', marginTop: '5px'}}>Acérque una tarjeta al lector para comenzar</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>UID</th>
                  <th>Nombre</th>
                  <th>Grado</th>
                  <th>Nivel</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td style={{fontSize: '10px', fontFamily: 'monospace', color: '#888'}}>{s.uid}</td>
                    <td style={{fontWeight: '500'}}>{s.name}</td>
                    <td>{s.grade}</td>
                    <td>
                      <span className={s.level === 3 ? 'badge badge-admin' : s.level === 2 ? 'badge badge-profesor' : 'badge badge-alumno'}>
                        {getLevelIcon(s.level)} {getLevelText(s.level)}
                      </span>
                    </td>
                    <td>
                      <button
                        style={{background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer'}}
                        onClick={() => handleDelete(s.id, s.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>
            <Calendar size={18} style={{display: 'inline', verticalAlign: 'middle', marginRight: '8px'}} />
            HISTORIAL
          </h2>
          <div style={{marginBottom: '12px'}}>
            <button
              className="btn btn-warning"
              style={{width: 'auto', display: 'inline-block', padding: '8px 16px', fontSize: '11px'}}
              onClick={() => setFilter(filter === 'today' ? 'all' : 'today')}
            >
              <Filter size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}} />
              {filter === 'today' ? 'VER TODOS' : 'SOLO HOY'}
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <Calendar size={40} color="#333" />
              <p style={{marginTop: '10px'}}>No hay registros</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grado</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td style={{fontWeight: '500'}}>{a.name}</td>
                    <td>{a.grade || '-'}</td>
                    <td style={{fontSize: '12px'}}>{a.date}</td>
                    <td style={{fontSize: '12px', fontFamily: 'monospace'}}>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
