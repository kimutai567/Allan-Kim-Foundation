import { Link } from 'react-router-dom'
import { money } from '../api'

export default function ProgramCard({ p, full }) {
  const pct = p.goal ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0
  return (
    <div className="card">
      <div className="icon">{p.icon}</div>
      <h3>{p.title}</h3>
      <p><b>{p.summary}</b></p>
      {full && <p>{p.description}</p>}
      {p.goal > 0 && (<>
        <div className="bar"><div style={{ width: pct + '%' }} /></div>
        <small>{money(p.raised)} of {money(p.goal)} ({pct}%)</small>
      </>)}
      <p><Link to={`/donate?program=${p.id}`} className="btn small">Support this</Link></p>
    </div>
  )
}
