import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, money } from '../../api'

const TABS = ['Overview', 'Donations', 'Partners', 'Messages', 'Programs', 'Payment Settings', 'Account']

export default function Dashboard() {
  const [tab, setTab] = useState('Overview')
  const nav = useNavigate()
  const logout = () => { localStorage.removeItem('akf_token'); nav('/admin/login') }
  return (
    <div className="section" style={{ maxWidth: 1250 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <div><Link to="/">View site</Link> · <a href="#" onClick={e => { e.preventDefault(); logout() }}>Log out</a></div>
      </div>
      <div className="tabs">{TABS.map(t => <button key={t} className={'chip' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Donations' && <Donations />}
      {tab === 'Partners' && <Partners />}
      {tab === 'Messages' && <Messages />}
      {tab === 'Programs' && <Programs />}
      {tab === 'Payment Settings' && <PaymentSettings />}
      {tab === 'Account' && <Account />}
    </div>
  )
}

function useLoad(path) {
  const [data, setData] = useState(null)
  const load = useCallback(() => api(path, { admin: true }).then(setData).catch(() => {}), [path])
  useEffect(() => { load() }, [load])
  return [data, load]
}

const date = s => new Date(s.replace(' ', 'T') + 'Z').toLocaleString()

function Overview() {
  const [s] = useLoad('/admin/summary')
  if (!s) return <p>Loading…</p>
  return (
    <>
      <div className="grid">
        <div className="card"><h3>{money(s.confirmed.s)}</h3>Confirmed (KES donations), {s.confirmed.c} donations</div>
        <div className="card"><h3>{s.pending}</h3>Pending donations to verify</div>
        <div className="card"><h3>{s.newPartners}</h3>New partner requests</div>
        <div className="card"><h3>{s.messages}</h3>Messages</div>
      </div>
      <h3>By method (confirmed)</h3>
      <table><thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead>
        <tbody>{s.byMethod.map(m => <tr key={m.method}><td>{m.method}</td><td>{m.c}</td><td>{m.s}</td></tr>)}</tbody></table>
    </>
  )
}

function Donations() {
  const [rows, load] = useLoad('/admin/donations')
  const set = async (id, status) => { await api('/admin/donations/' + id, { method: 'PATCH', admin: true, body: { status } }); load() }
  if (!rows) return <p>Loading…</p>
  return (
    <div className="scroll"><table>
      <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Method</th><th>Reference</th><th>Program</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.map(d => (
        <tr key={d.id}>
          <td>{date(d.created_at)}</td>
          <td>{d.name || 'Anonymous'}{d.anonymous ? ' (hidden)' : ''}<br /><small>{d.email} {d.phone}</small></td>
          <td>{d.currency === 'KES' ? money(d.amount) : ` `}</td><td>{d.method}</td><td>{d.reference}</td><td>{d.program || '-'}</td>
          <td><span className={'tag ' + d.status}>{d.status}</span></td>
          <td>
            {d.status !== 'confirmed' && <button className="btn sm" onClick={() => set(d.id, 'confirmed')}>Confirm</button>}{' '}
            {d.status !== 'rejected' && <button className="btn sm gray" onClick={() => set(d.id, 'rejected')}>Reject</button>}
          </td>
        </tr>))}</tbody>
    </table></div>
  )
}

function Partners() {
  const [rows, load] = useLoad('/admin/partners')
  const set = async (id, status) => { await api('/admin/partners/' + id, { method: 'PATCH', admin: true, body: { status } }); load() }
  if (!rows) return <p>Loading…</p>
  return (
    <div className="scroll"><table>
      <thead><tr><th>Date</th><th>Organization</th><th>Contact</th><th>Message</th><th>Status</th></tr></thead>
      <tbody>{rows.map(p => (
        <tr key={p.id}>
          <td>{date(p.created_at)}</td><td><b>{p.organization}</b><br /><small>{p.type}</small></td>
          <td>{p.contact_name}<br /><a href={'mailto:' + p.email}>{p.email}</a><br />{p.phone}</td>
          <td style={{ maxWidth: 360 }}>{p.message}</td>
          <td><select value={p.status} onChange={e => set(p.id, e.target.value)}>
            {['new', 'contacted', 'active', 'declined'].map(s => <option key={s}>{s}</option>)}</select></td>
        </tr>))}</tbody>
    </table></div>
  )
}

function Messages() {
  const [rows] = useLoad('/admin/messages')
  if (!rows) return <p>Loading…</p>
  return <table><thead><tr><th>Date</th><th>From</th><th>Message</th></tr></thead>
    <tbody>{rows.map(m => <tr key={m.id}><td>{date(m.created_at)}</td><td>{m.name}<br /><a href={'mailto:' + m.email}>{m.email}</a></td><td>{m.message}</td></tr>)}</tbody></table>
}

function Programs() {
  const [rows, load] = useLoad('/admin/programs')
  const [edit, setEdit] = useState(null)
  async function save(e) {
    e.preventDefault()
    if (edit.id) await api('/admin/programs/' + edit.id, { method: 'PUT', admin: true, body: edit })
    else await api('/admin/programs', { method: 'POST', admin: true, body: edit })
    setEdit(null); load()
  }
  const f = k => ({ value: edit[k] ?? '', onChange: e => setEdit({ ...edit, [k]: e.target.value }) })
  if (!rows) return <p>Loading…</p>
  return (
    <>
      <button className="btn" onClick={() => setEdit({ title: '', summary: '', description: '', icon: '❤️', goal: 0, active: 1 })}>+ New program</button>
      {edit && (
        <form className="form card" onSubmit={save} style={{ margin: '16px 0' }}>
          <label>Title<input required {...f('title')} /></label>
          <label>Icon (emoji)<input {...f('icon')} /></label>
          <label>Summary<input {...f('summary')} /></label>
          <label>Description<textarea {...f('description')} /></label>
          <label>Goal (KES)<input type="number" {...f('goal')} /></label>
          <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={!!edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked ? 1 : 0 })} />Visible on site</label>
          <div><button className="btn">Save</button> <button type="button" className="btn gray" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>)}
      <table style={{ marginTop: 16 }}><thead><tr><th></th><th>Title</th><th>Raised / Goal</th><th>Visible</th><th></th></tr></thead>
        <tbody>{rows.map(p => <tr key={p.id}><td>{p.icon}</td><td>{p.title}</td><td>{money(p.raised)} / {money(p.goal)}</td><td>{p.active ? 'Yes' : 'No'}</td>
          <td><button className="btn sm" onClick={() => setEdit(p)}>Edit</button></td></tr>)}</tbody></table>
    </>
  )
}

const LABELS = {
  mpesa_paybill: 'M-Pesa Send Money phone number', mpesa_account: 'M-Pesa recipient name', airtel_number: 'Airtel Money number', airtel_name: 'Airtel Money recipient name',
  bank_name: 'Bank name', bank_account_name: 'Bank account name', bank_account_number: 'Bank account number', bank_branch: 'Bank branch',
  crypto_btc: 'Bitcoin (BTC) address', crypto_eth: 'Ethereum (ETH) address', crypto_eth_network: 'Ethereum network (e.g. ERC-20)',
  crypto_usdt: 'USDT address', crypto_usdt_network: 'USDT network (e.g. TRC20)',
  usd_kes_rate: 'Exchange rate: KES per 1 USD (used to show dollar amounts)',
}
function PaymentSettings() {
  const [s] = useLoad('/payment-info')
  const [f, setF] = useState(null)
  const [msg, setMsg] = useState(null)
  useEffect(() => { if (s) setF(s) }, [s])
  if (!f) return <p>Loading…</p>
  async function save(e) {
    e.preventDefault(); setMsg(null)
    try {
      const saved = await api('/admin/settings', { method: 'PUT', admin: true, body: f })
      setF(saved); setMsg({ ok: true, text: 'Saved. These details now show on the Donate page.' })
    } catch (x) { setMsg({ ok: false, text: 'Not saved: ' + x.message }) }
  }
  return (
    <form className="form" onSubmit={save}>
      {Object.keys(LABELS).map(k => <label key={k}>{LABELS[k]}<input value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}
      {msg && <div className={'notice' + (msg.ok ? '' : ' err')}>{msg.text}</div>}
      <button className="btn">Save payment details</button>
    </form>
  )
}

function Account() {
  const [f, setF] = useState({ current: '', next: '' })
  const [msg, setMsg] = useState(null)
  async function save(e) {
    e.preventDefault()
    try { await api('/admin/password', { method: 'POST', admin: true, body: f }); setMsg({ ok: true, text: 'Password changed.' }); setF({ current: '', next: '' }) }
    catch (x) { setMsg({ ok: false, text: x.message }) }
  }
  return (
    <form className="form" onSubmit={save}>
      <label>Current password<input type="password" required value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /></label>
      <label>New password (min 8)<input type="password" required value={f.next} onChange={e => setF({ ...f, next: e.target.value })} /></label>
      {msg && <div className={'notice' + (msg.ok ? '' : ' err')}>{msg.text}</div>}
      <button className="btn">Change password</button>
    </form>
  )
}
