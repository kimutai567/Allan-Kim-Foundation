import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../api'

export default function Login() {
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    try { const r = await api('/admin/login', { method: 'POST', body: f }); localStorage.setItem('akf_token', r.token); nav('/admin') }
    catch (x) { setErr(x.message) }
  }
  return (
    <section className="section">
      <h1>Admin Login</h1>
      <form className="form" onSubmit={submit}>
        <label>Email<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
        {err && <div className="notice err">{err}</div>}
        <button className="btn">Sign in</button>
        <Link to="/">← Back to site</Link>
      </form>
    </section>
  )
}
