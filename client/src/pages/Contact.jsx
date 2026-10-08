import { useState } from 'react'
import { api } from '../api'

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' })
  const [msg, setMsg] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    try { const r = await api('/contact', { method: 'POST', body: f }); setMsg({ ok: true, text: r.message }); setF({ name: '', email: '', message: '' }) }
    catch (err) { setMsg({ ok: false, text: err.message }) }
  }
  return (
    <section className="section">
      <h1>Contact Us</h1>
      <form className="form" onSubmit={submit}>
        <label>Name<input required value={f.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Message<textarea required value={f.message} onChange={set('message')} /></label>
        {msg && <div className={'notice' + (msg.ok ? '' : ' err')}>{msg.text}</div>}
        <button className="btn">Send</button>
      </form>
    </section>
  )
}
