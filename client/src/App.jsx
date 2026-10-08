import { Routes, Route, NavLink, Link, Navigate, Outlet } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Programs from './pages/Programs.jsx'
import Donate from './pages/Donate.jsx'
import Partner from './pages/Partner.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'

function Layout() {
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="" width="42" height="42" />
          <span>Allan Kim<small>Foundation</small></span>
        </Link>
        <nav>
          <NavLink to="/programs">Programs</NavLink>
          <NavLink to="/partner">Partner With Us</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <Link to="/donate" className="btn small">Donate</Link>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <img src="/logo.svg" alt="Allan Kim Foundation logo" width="56" height="56" />
        <p><b>Allan Kim Foundation</b><br />Dignity, education and inclusion for every child.</p>
        <p className="muted">© {new Date().getFullYear()} Allan Kim Foundation · Kenya · <Link to="/admin">Admin</Link></p>
      </footer>
    </>
  )
}

const Guard = ({ children }) => localStorage.getItem('akf_token') ? children : <Navigate to="/admin/login" replace />

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/partner" element={<Partner />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<Guard><Dashboard /></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
