'use client'

import { useState, useEffect, useCallback } from 'react'

export default function Home() {
  const [stats, setStats] = useState({ totalStudents: 0, todayAttendance: 0, totalRecords: 0, recent: [] })
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [status, setStatus] = useState({ type: 'info', text: 'Conectando...' })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ uid: '', name: '', grade: '', level: 1 })
  const [filter, setFilter] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, studentsRes, attendRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/students'),
        fetch('/api/attendance')
      ])
      
      if (statsRes.ok) setStats(await statsRes.json())
      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (attendRes.ok) setAttendance(await attendRes.json())
      
      setStatus({ type: 'ok', text: 'Sistema listo - Acerque tarjeta al lector' })
    } catch (e) {
      setStatus({ type: 'error', text: 'Error de conexion' })
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.ok) {
        setStatus({ type: 'ok', text: 'Alumno registrado: ' + formData.name })
        setShowForm(false)
        setFormData({ uid: '', name: '', grade: '', level: 1 })
        fetchData()
      } else {
        setStatus({ type: 'error', text: data.message })
      }
    } catch (e) {
      setStatus({ type: 'error', text: 'Error al registrar' })
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm('Eliminar a ' + name + '?')) return
    try {
      await fetch('/api/students?id=' + id, { method: 'DELETE' })
      fetchData()
    } catch (e) {
      setStatus({ type: 'error', text: 'Error al eliminar' })
    }
  }

  const filteredAttendance = attendance.filter(a => {
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      return a.date === today
    }
    return true
  })

  return (
    <>
      <div className="header">
        <h1>SISTEMA DE ASISTENCIA</h1>
        <p>Control Escolar por RFID</p>
      </div>

      <div className="container">
        <div className="status status-' + status.type">{status.text}</div>

        <div className="stats">
          <div className="stat-box">
            <div className="number">{stats.totalStudents}</div>
            <div className="label">Alumnos</div>
          </div>
          <div className="stat-box">
            <div className="number">{stats.todayAttendance}</div>
            <div className="label">Hoy Asistieron</div>
          </div>
          <div className="stat-box">
            <div className="number">{stats.totalRecords}</div>
            <div className="label">Registros</div>
          </div>
        </div>

        {stats.recent && stats.recent.length > 0 && (
          <div className="ultimo-marcado">
            <p style={{color: '#666', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'}}>Ultimo registro</p>
            <div className="nombre">{stats.recent[0].name}</div>
            <div className="grado">{stats.recent[0].grade || ''}</div>
            <div className="hora">{stats.recent[0].time} - {stats.recent[0].date}</div>
          </div>
        )}

        <div className="card">
          <h2>Acciones</h2>
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'CANCELAR' : 'REGISTRAR NUEVO ALUMNO'}
          </button>
          <button className="btn btn-primary" onClick={fetchData}>ACTUALIZAR</button>
        </div>

        {showForm && (
          <div className="card">
            <h2>Registrar Alumno</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>UID Tarjeta (desde lector)</label>
                <input 
                  type="text" 
                  value={formData.uid} 
                  onChange={e => setFormData({...formData, uid: e.target.value})}
                  placeholder="Ej: 08:8D:57:DB"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nombre completo</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Juan Perez"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Grado / Seccion</label>
                <input 
                  type="text" 
                  value={formData.grade} 
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                  placeholder="Ej: 5to A"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <select 
                  value={formData.level} 
                  onChange={e => setFormData({...formData, level: parseInt(e.target.value)})}
                >
                  <option value={1}>Alumno</option>
                  <option value={2}>Profesor</option>
                  <option value={3}>Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">GUARDAR</button>
            </form>
          </div>
        )}

        <div className="card">
          <h2>Alumnos ({students.length})</h2>
          {students.length === 0 ? (
            <div className="empty">No hay alumnos registrados</div>
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
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{fontSize: '11px', fontFamily: 'monospace'}}>{s.uid}</td>
                    <td>{s.name}</td>
                    <td>{s.grade}</td>
                    <td>
                      <span className={'badge badge-' + (s.level === 3 ? 'admin' : s.level === 2 ? 'profesor' : 'alumno')}>
                        {s.level === 3 ? 'Admin' : s.level === 2 ? 'Profesor' : 'Alumno'}
                      </span>
                    </td>
                    <td>
                      <button 
                        style={{background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer', fontSize: '18px'}}
                        onClick={() => handleDelete(s.id, s.name)}
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Historial</h2>
          <div style={{marginBottom: '10px'}}>
            <button 
              className="btn btn-warning" 
              style={{width: 'auto', display: 'inline-block', padding: '8px 16px', fontSize: '12px'}}
              onClick={() => setFilter(filter === 'today' ? 'all' : 'today')}
            >
              {filter === 'today' ? 'VER TODOS' : 'SOLO HOY'}
            </button>
          </div>
          {filteredAttendance.length === 0 ? (
            <div className="empty">No hay registros</div>
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
                {filteredAttendance.slice(0, 50).map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.grade || '-'}</td>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
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
