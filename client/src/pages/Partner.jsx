import { useState } from 'react'
import { api } from '../api'

const WAYS = [
  ['💰', 'Fund a program', 'Co-fund dignity packs, school shoes or disability support and follow the program total on this site.'],
  ['📦', 'Give in kind', 'Donate pads, shoes, assistive devices or logistics to reach more schools.'],
  ['🏫', 'Work through schools', 'Help us reach pupils through schools, county offices and community organizations.'],
  ['📣', 'Raise awareness', 'Share the work with your staff, members and networks.'],
]

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
      <h3>Ways to partner</h3>
      <div className="grid" style={{ marginBottom: 32 }}>
        {WAYS.map(([icon, t, d]) => <div className="card" key={t}><div className="icon">{icon}</div><h3>{t}</h3><p>{d}</p></div>)}
      </div>
      <h3>Send a partnership request</h3>
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
