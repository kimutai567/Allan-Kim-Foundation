import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, usd } from '../api'

const METHODS = [['mpesa', 'M-Pesa'], ['airtel', 'Airtel Money'], ['bank', 'Bank Transfer'], ['crypto', 'Crypto']]

export default function Donate() {
  const [sp] = useSearchParams()
  const [programs, setPrograms] = useState([])
  const [info, setInfo] = useState({})
  const [method, setMethod] = useState('mpesa')
  const [coin, setCoin] = useState('USDT')
  const [f, setF] = useState({ name: '', email: '', phone: '', amount: '', reference: '', program_id: sp.get('program') || '', anonymous: false })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => { api('/programs').then(setPrograms); api('/payment-info').then(setInfo) }, [])

  const wallet = { BTC: info.crypto_btc, ETH: info.crypto_eth, USDT: info.crypto_usdt }[coin]

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    try {
      const r = await api('/donations', { method: 'POST', body: { ...f, amount: method === 'crypto' ? f.amount : Math.round(Number(f.amount)), method, currency: coin, program_id: f.program_id || null } })
      setMsg({ ok: true, text: r.message }); setF({ ...f, amount: '', reference: '' })
    } catch (err) { setMsg({ ok: false, text: err.message }) }
    setBusy(false)
  }

  return (
    <section className="section">
      <h1>Make a Donation</h1>
      <p>No account needed. Pay using your preferred method below, then tell us about it so we can confirm and thank you.</p>
      <h3>1. Choose how to pay</h3>
      <div className="chips">{METHODS.map(([k, l]) => <button key={k} type="button" className={'chip' + (method === k ? ' on' : '')} onClick={() => setMethod(k)}>{l}</button>)}</div>

      <div className="box">
        {method === 'mpesa' && <>Send money via M-Pesa to <b>{info.mpesa_paybill}</b><br />Recipient: <b>{info.mpesa_account}</b></>}
        {method === 'airtel' && <>Send via Airtel Money to <b>{info.airtel_number}</b> ({info.airtel_name})</>}
        {method === 'bank' && <>Bank: <b>{info.bank_name}</b><br />Account name: <b>{info.bank_account_name}</b><br />Account no: <b>{info.bank_account_number}</b>{info.bank_branch && <><br />Branch: {info.bank_branch}</>}</>}
        {method === 'crypto' && <>
          <div className="chips">{['USDT', 'BTC', 'ETH'].map(c => <button key={c} type="button" className={'chip' + (coin === c ? ' on' : '')} onClick={() => setCoin(c)}>{c}</button>)}</div>
          {wallet ? <>
            <p>Send only <b>{coin}</b>{coin === 'USDT' && <> on <b>{info.crypto_usdt_network}</b></>}{coin === 'ETH' && <> on <b>Ethereum ({info.crypto_eth_network})</b></>} to:<br /><b>{wallet}</b></p>
            <QRCodeSVG value={wallet} size={140} />
          </> : <p>This wallet address is not set up yet.</p>}
        </>}
      </div>

      <h3>2. Tell us about your donation</h3>
      <form className="form" onSubmit={submit}>
        <label>Amount ({method === 'crypto' ? coin : 'KES'})<input type="number" step="any" min="1" required value={f.amount} onChange={set('amount')} />
          {method !== 'crypto' && Number(f.amount) > 0 && <small>≈ {usd(f.amount)} USD</small>}</label>
        <label>{method === 'crypto' ? 'Transaction hash' : method === 'bank' ? 'Bank reference / slip number' : 'Transaction code (e.g. QGH7XXXXX)'}<input required value={f.reference} onChange={set('reference')} /></label>
        <label>Support program<select value={f.program_id} onChange={set('program_id')}><option value="">Where it is needed most</option>{programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>Your name (optional)<input value={f.name} onChange={set('name')} /></label>
        <label>Email for receipt (optional)<input type="email" value={f.email} onChange={set('email')} /></label>
        <label>Phone (optional)<input value={f.phone} onChange={set('phone')} /></label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={f.anonymous} onChange={set('anonymous')} /> Keep my donation anonymous</label>
        {msg && <div className={'notice' + (msg.ok ? '' : ' err')}>{msg.text}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'I have made this donation'}</button>
      </form>
    </section>
  )
}
