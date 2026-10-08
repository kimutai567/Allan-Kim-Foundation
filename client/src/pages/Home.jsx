import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from '../api'
import ProgramCard from '../components/ProgramCard.jsx'
import Gallery from '../components/Gallery.jsx'

export default function Home() {
  const [programs, setPrograms] = useState([])
  const [stats, setStats] = useState(null)
  useEffect(() => { api('/programs').then(setPrograms).catch(() => {}); api('/stats').then(setStats).catch(() => {}) }, [])
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <span className="pill">Kenya · Dignity · Education · Inclusion</span>
          <h1>No child should miss school<br />because of <em>poverty</em> or <em>disability</em></h1>
          <p>The Allan Kim Foundation provides sanitary pads, school shoes and disability support to vulnerable children, with the help of partners and donors worldwide.</p>
          <div className="cta">
            <Link to="/donate" className="btn lg">Donate Now</Link>
            <Link to="/partner" className="btn lg ghost-w">Become a Partner</Link>
          </div>
        </div>
      </section>
      {stats && (
        <div className="stats overlap">
          <div className="stat"><b>{money(stats.raised)}</b>raised</div>
          <div className="stat"><b>{stats.donations}</b>donations</div>
          <div className="stat"><b>{stats.partners}</b>partners</div>
        </div>
      )}
      <section className="section">
        <h2 className="title">Every child deserves a chance</h2>
        <p className="lead">Hundreds of children miss class because they cannot afford pads, shoes or the support they need. Together we change that.</p>
        <Gallery />
      </section>
      <section className="band">
        <div className="section">
          <h2 className="title">Our Programs</h2>
          <div className="grid">{programs.map(p => <ProgramCard key={p.id} p={p} />)}</div>
        </div>
      </section>
      <section className="section">
        <h2 className="title">How you can help</h2>
        <div className="grid">
          <div className="card step"><span>1</span><h3>Donate</h3><p>Give via M-Pesa, Airtel Money, bank or crypto. No account needed.</p></div>
          <div className="card step"><span>2</span><h3>Partner</h3><p>Governments, NGOs and companies can co-fund programs at scale.</p></div>
          <div className="card step"><span>3</span><h3>Change lives</h3><p>Your gift becomes pads, shoes and support that keep children learning.</p></div>
        </div>
      </section>
      <section className="cta-band">
        <h2>Let us build this together</h2>
        <p>Governments, global foundations, NGOs and corporates: partner with us to reach every county.</p>
        <Link to="/partner" className="btn lg light">Start a partnership</Link>
      </section>
    </>
  )
}
