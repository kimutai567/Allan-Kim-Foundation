import { useEffect, useState } from 'react'
import { api } from '../api'
import ProgramCard from '../components/ProgramCard.jsx'

export default function Programs() {
  const [programs, setPrograms] = useState([])
  useEffect(() => { api('/programs').then(setPrograms).catch(() => {}) }, [])
  return (
    <section className="section">
      <h1>Our Programs</h1>
      <div className="grid">{programs.map(p => <ProgramCard key={p.id} p={p} full />)}</div>
    </section>
  )
}
