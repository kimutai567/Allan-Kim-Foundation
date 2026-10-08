import { useState } from 'react'
import { api } from '../api'

export default function Partner() {
  const empty = { organization: '', type: 'government', contact_name: '', email: '', phone: '', message: '' }
  const [f, setF] = useState(empty)
  const [msg, setMsg] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    try { const r = await api('/partners', { method: 'POST', body: f }); setMsg({ ok: true, text: r.message }); setF(empty) }
    catch (err) { setMsg({ ok: false, text: err.message }) }
  }
  return (
    <section className="section">
      <h1>Partner With Us</h1>
      <p>We welcome governments, global foundations, NGOs, corporates and schools to partner on sanitary health, school shoes, disability inclusion and more.</p>
      <form className="form" onSubmit={submit}>
        <label>Organization<input required value={f.organization} onChange={set('organization')} /></label>
        <label>Type<select value={f.type} onChange={set('type')}>
          <option value="government">Government / Ministry</option><option value="global">Global foundation / UN agency</option>
          <option value="ngo">NGO</option><option value="corporate">Corporate / CSR</option><option value="school">School / Institution</option><option value="other">Other</option>
        </select></label>
        <label>Contact person<input value={f.contact_name} onChange={set('contact_name')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Phone<input value={f.phone} onChange={set('phone')} /></label>
        <label>How would you like to partner?<textarea required value={f.message} onChange={set('message')} /></label>
        {msg && <div className={'notice' + (msg.ok ? '' : ' err')}>{msg.text}</div>}
        <button className="btn">Send partnership request</button>
      </form>
    </section>
  )
}
