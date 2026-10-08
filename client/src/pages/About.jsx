import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from '../api'
import ProgramCard from '../components/ProgramCard.jsx'

const PRINCIPLES = [
  ['🎯', 'Focused', 'Three clear programs: dignity packs, school shoes and disability support, each with a published funding goal.'],
  ['🔍', 'Transparent', 'Every donation is checked against its payment record by an administrator before it is counted as confirmed.'],
  ['🤝', 'Collaborative', 'We work alongside governments, NGOs, companies and schools so support reaches children at scale.'],
]

export default function About() {
  const [programs, setPrograms] = useState([])
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/programs').then(setPrograms).catch(() => {}); api('/stats').then(setStats).catch(() => {}) }, [])
  return (
    <>
      <section className="page-hero">
        <h1>About the Allan Kim Foundation</h1>
        <p>Dignity, education and inclusion for every child in Kenya.</p>
      </section>

      <section className="section">
        <h2 className="title">Why we exist</h2>
        <p className="lead">
          Many children miss school because their families cannot afford sanitary pads, shoes or the support
          needed to live with a disability. The Allan Kim Foundation exists so that poverty and disability are
          never the reason a child falls behind.
        </p>
        <div className="grid">
          {PRINCIPLES.map(([icon, t, d]) => (
            <div className="card" key={t}><div className="icon">{icon}</div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="section">
          <h2 className="title">What we do</h2>
          <div className="grid">{programs.map(p => <ProgramCard key={p.id} p={p} full />)}</div>
        </div>
      </section>

      <section className="section">
        <h2 className="title">Accountability</h2>
        <p className="lead">
          Donors pay directly to the foundation's published accounts, then submit their transaction reference.
          Each record is verified by an administrator before it is confirmed and added to a program's total.
        </p>
        {stats && (
          <div className="stats">
            <div className="stat"><b>{money(stats.raised)}</b>confirmed donations</div>
            <div className="stat"><b>{stats.donations}</b>verified gifts</div>
            <div className="stat"><b>{stats.partners}</b>active partners</div>
          </div>
        )}
      </section>

      <section className="cta-band">
        <h2>Partner with us</h2>
        <p>Tell us how your organization would like to help and our team will respond.</p>
        <Link to="/partner" className="btn lg light">Start a partnership</Link>
      </section>
    </>
  )
}
