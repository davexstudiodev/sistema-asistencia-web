'use client'

import { useState, useEffect } from 'react'

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

  async function fetchData() {
    try {
      const statsRes = await fetch('/api/stats')
      const studentsRes = await fetch('/api/students')
      const attendRes = await fetch('/api/attendance')
      const pendingRes = await fetch('/api/pending')

      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats(s)
      }
      if (studentsRes.ok) {
        const s = await studentsRes.json()
        setStudents(s)
      }
      if (attendRes.ok) {
        const a = await attendRes.json()
        setAttendance(a)
      }

      if (pendingRes.ok) {
        const p = await pendingRes.json()
        if (p.pending && p.uid !== lastPending) {
          setLastPending(p.uid)
          setFormData({ uid: p.uid, name: '', grade: '', level: 1 })
          setShowForm(true)
          setStatusText('NUEVA TARJETA: ' + p.uid)
          setStatusType('waiting')
          return
        }
      }

      setStatusText('Sistema listo - Acerque tarjeta')
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
        setStatusText('Alumno registrado: ' + formData.name)
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
    try {
      await fetch('/api/students?id=' + id, { method: 'DELETE' })
      fetchData()
    } catch (e) {}
  }

  function getStatusClass() {
    if (statusType === 'ok') return 'status status-ok'
    if (statusType === 'error') return 'status status-error'
    if (statusType === 'waiting') return 'status status-waiting'
    return 'status status-info'
  }

  function getFilteredAttendance() {
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      return attendance.filter(a => a.date === today)
    }
    return attendance
  }

  const filtered = getFilteredAttendance()

  return (
    <>
      <div className="header">
        <h1>SISTEMA DE ASISTENCIA</h1>
        <p>Control Escolar por RFID</p>
      </div>

      <div className="container">
        <div className={getStatusClass()}>{statusText}</div>

        <div className="stats">
          <div className="stat-box">
            <div className="number">{stats.totalStudents || 0}</div>
            <div className="label">Alumnos</div>
          </div>
          <div className="stat-box">
            <div className="number">{stats.todayAttendance || 0}</div>
            <div className="label">Hoy Asistieron</div>
          </div>
          <div className="stat-box">
            <div className="number">{stats.totalRecords || 0}</div>
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
          <div className="card" style={{border: '1px solid #00d4ff'}}>
            <h2>{lastPending ? 'NUEVA TARJETA DETECTADA' : 'Registrar Alumno'}</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>UID Tarjeta</label>
                <input
                  type="text"
                  value={formData.uid}
                  onChange={(e) => setFormData({...formData, uid: e.target.value})}
                  placeholder="Se llena automaticamente"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Juan Perez"
                  required
                />
              </div>
              <div className="form-group">
                <label>Grado / Seccion</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  placeholder="Ej: 5to A"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                >
                  <option value="1">Alumno</option>
                  <option value="2">Profesor</option>
                  <option value="3">Admin</option>
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
                {students.map((s) => (
                  <tr key={s.id}>
                    <td style={{fontSize: '11px', fontFamily: 'monospace'}}>{s.uid}</td>
                    <td>{s.name}</td>
                    <td>{s.grade}</td>
                    <td>
                      <span className={s.level === 3 ? 'badge badge-admin' : s.level === 2 ? 'badge badge-profesor' : 'badge badge-alumno'}>
                        {s.level === 3 ? 'Admin' : s.level === 2 ? 'Profesor' : 'Alumno'}
                      </span>
                    </td>
                    <td>
                      <button
                        style={{background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer', fontSize: '18px'}}
                        onClick={() => handleDelete(s.id, s.name)}
                      >x</button>
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
          {filtered.length === 0 ? (
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
                {filtered.slice(0, 50).map((a) => (
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
