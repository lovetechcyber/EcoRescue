// EcoRescue Frontend (React + Vite + Tailwind)
// Single codepack file: create files below in a new project 'ecorescue-frontend'

/*
PROJECT STRUCTURE (create these files):

package.json
vite.config.js
tailwind.config.cjs
postcss.config.cjs
src/main.jsx
src/index.css
src/App.jsx
src/routes/PrivateRoute.jsx
src/context/AuthContext.jsx
src/services/api.js
src/pages/Signup.jsx
src/pages/Login.jsx
src/pages/UserDashboard.jsx
src/pages/AdminDashboard.jsx
src/components/Header.jsx
src/components/MapHeatmap.jsx
src/components/WeatherCard.jsx

.env.local (REACT_APP_... variables)

Instructions: follow README snippet at bottom to install and run.
*/

/* ---------- package.json ---------- */
// create package.json with these dependencies
{
  "name": "ecorescue-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dayjs": "^1.11.9",
    "mapbox-gl": "^2.15.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.1",
    "swr": "^2.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.4.7",
    "vite": "^5.0.0"
  }
}

/* ---------- tailwind.config.cjs ---------- */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

/* ---------- postcss.config.cjs ---------- */
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {}, }, };

/* ---------- vite.config.js ---------- */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, proxy: {
    '/api': { target: 'http://localhost:4000', changeOrigin: true, secure: false }
  } }
})

/* ---------- src/index.css ---------- */
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }

/* small helper */
.app-shell { min-height: 100%; display: flex; flex-direction: column; }

/* ---------- src/main.jsx ---------- */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

/* ---------- src/services/api.js ---------- */
import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

// attach access token automatically
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// response interceptor: refresh token on 401
let isRefreshing = false
let subscribers = []
function onRefreshed(token) { subscribers.forEach(cb => cb(token)); subscribers = [] }
function addSubscriber(cb) { subscribers.push(cb) }

api.interceptors.response.use(r=>r, async err => {
  const original = err.config
  if (err.response && err.response.status === 401 && !original._retry) {
    original._retry = true
    if (!isRefreshing) {
      isRefreshing = true
      const refreshToken = localStorage.getItem('refreshToken')
      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('refreshToken', res.data.refreshToken)
        onRefreshed(res.data.accessToken)
        isRefreshing = false
        return api(original)
      } catch (e) {
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(e)
      }
    }

    return new Promise((resolve, reject) => {
      addSubscriber((token) => {
        original.headers.Authorization = `Bearer ${token}`
        resolve(api(original))
      })
    })
  }
  return Promise.reject(err)
})

export default api

/* ---------- src/context/AuthContext.jsx ---------- */
import React, { createContext, useEffect, useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    // fetch profile
    api.get('/auth/profile').then(res => { setUser(res.data.user); }).catch(()=>{ localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); }).finally(()=>setLoading(false))
  }, [])

  async function signup(payload) {
    const res = await api.post('/auth/register', payload)
    // If register returns tokens, store them
    if (res.data.tokens) {
      localStorage.setItem('accessToken', res.data.tokens.accessToken)
      localStorage.setItem('refreshToken', res.data.tokens.refreshToken)
      setUser(res.data.user)
      navigate('/dashboard')
    }
    return res
  }

  async function login(payload) {
    const res = await api.post('/auth/login', payload)
    localStorage.setItem('accessToken', res.data.tokens.accessToken)
    localStorage.setItem('refreshToken', res.data.tokens.refreshToken)
    setUser(res.data.user)
    navigate('/dashboard')
    return res
  }

  function logout() {
    const rt = localStorage.getItem('refreshToken')
    api.post('/auth/logout', { refreshToken: rt }).catch(()=>{})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    navigate('/login')
  }

  return <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

/* ---------- src/routes/PrivateRoute.jsx ---------- */
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

/* ---------- src/App.jsx ---------- */
import React, { useContext } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PrivateRoute from './routes/PrivateRoute'
import { AuthContext } from './context/AuthContext'
import Header from './components/Header'

export default function App(){
  const { user } = useContext(AuthContext)
  return (
    <div className="app-shell">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={user ? <UserDashboard/> : <Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/dashboard" element={<PrivateRoute><UserDashboard/></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard/></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

/* ---------- src/components/Header.jsx ---------- */
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Header(){
  const { user, logout } = useContext(AuthContext)
  return (
    <header className="bg-white shadow px-4 py-3 flex items-center justify-between">
      <Link to="/" className="font-bold text-lg">EcoRescue</Link>
      <nav className="flex items-center gap-4">
        <Link to="/dashboard" className="text-sm">Dashboard</Link>
        <Link to="/admin" className="text-sm">Admin</Link>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.fullName || user.phone}</span>
            <button onClick={logout} className="px-3 py-1 rounded bg-red-500 text-white text-sm">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Login</Link>
        )}
      </nav>
    </header>
  )
}

/* ---------- src/pages/Signup.jsx ---------- */
import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function Signup(){
  const { signup } = useContext(AuthContext)
  const [form, setForm] = useState({ fullName:'', phone:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e){
    e.preventDefault(); setLoading(true); setError(null)
    try { await signup(form) } catch (err) { setError(err?.response?.data?.error || 'Failed') }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-4">Sign up</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Full name" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />
        <input className="w-full p-2 border" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
        <input className="w-full p-2 border" placeholder="Email (optional)" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input type="password" className="w-full p-2 border" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        {error && <div className="text-red-600">{error}</div>}
        <button disabled={loading} className="w-full bg-green-600 text-white p-2 rounded">{loading ? 'Creating...' : 'Create account'}</button>
      </form>
    </div>
  )
}

/* ---------- src/pages/Login.jsx ---------- */
import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function Login(){
  const { login } = useContext(AuthContext)
  const [form, setForm] = useState({ phoneOrEmail:'', password:'' })
  const [err, setErr] = useState(null)

  async function submit(e){
    e.preventDefault(); setErr(null)
    try { await login(form) } catch (e) { setErr(e?.response?.data?.error || 'Login failed') }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Phone or Email" value={form.phoneOrEmail} onChange={e=>setForm({...form, phoneOrEmail:e.target.value})} />
        <input type="password" className="w-full p-2 border" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        {err && <div className="text-red-600">{err}</div>}
        <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </form>
      <div className="mt-4 text-sm">Don't have an account? <a className="text-blue-600" href="/signup">Sign up</a></div>
    </div>
  )
}

/* ---------- src/components/WeatherCard.jsx ---------- */
import React from 'react'

export default function WeatherCard({ weather }){
  if(!weather) return <div className="p-4">No weather</div>
  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="text-sm text-gray-500">{weather.name}</div>
      <div className="text-2xl font-bold">{Math.round(weather.main.temp)}°C</div>
      <div className="text-sm">{weather.weather[0].description}</div>
    </div>
  )
}

/* ---------- src/components/MapHeatmap.jsx ---------- */
import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

export default function MapHeatmap({ center = [3.3792,6.5244], heatFeatures = [] }){
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(()=>{ mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || ''; if(mapRef.current) return; mapRef.current = new mapboxgl.Map({ container: containerRef.current, style: 'mapbox://styles/mapbox/light-v10', center, zoom: 12 })
    mapRef.current.on('load', ()=>{ mapRef.current.addSource('heat', { type:'geojson', data: { type:'FeatureCollection', features: heatFeatures.map(h=>({ type:'Feature', geometry:{ type:'Point', coordinates:[h.lng,h.lat] }, properties:{ score: h.score } })) } })
      mapRef.current.addLayer({ id:'heatmap', type:'heatmap', source:'heat', paint: { 'heatmap-weight': ['interpolate',['linear'],['get','score'],0,0,10,1], 'heatmap-radius': 20 } })
    })
  }, [])

  useEffect(()=>{ if(mapRef.current && mapRef.current.getSource('heat')) { mapRef.current.getSource('heat').setData({ type:'FeatureCollection', features: heatFeatures.map(h=>({ type:'Feature', geometry:{ type:'Point', coordinates:[h.lng,h.lat] }, properties:{ score: h.score } })) }) } }, [heatFeatures])

  return <div ref={containerRef} className="w-full h-[600px] rounded shadow" />
}

/* ---------- src/pages/UserDashboard.jsx ---------- */
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'
import MapHeatmap from '../components/MapHeatmap'
import WeatherCard from '../components/WeatherCard'

export default function UserDashboard(){
  const { user } = useContext(AuthContext)
  const [heat, setHeat] = useState([])
  const [weather, setWeather] = useState(null)

  useEffect(()=>{ fetchHeat(); fetchWeather(); }, [])

  async function fetchHeat(){
    try { const res = await api.get('/reports/heatmap?centerLng=3.3792&centerLat=6.5244&radius=5000'); setHeat(res.data.features || []) } catch(e){ console.error(e) }
  }

  async function fetchWeather(){
    try { // backend weather proxy endpoint
      const res = await api.get('/external/weather?lng=3.3792&lat=6.5244'); setWeather(res.data)
    } catch(e){ console.error(e) }
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <MapHeatmap heatFeatures={heat} />
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 shadow rounded"> <h3 className="font-bold">Welcome, {user?.fullName || user?.phone}</h3></div>
          <WeatherCard weather={weather} />
          <div className="bg-white p-4 shadow rounded"> <h4 className="font-semibold">Quick Actions</h4>
            <div className="mt-2 space-y-2">
              <button className="w-full p-2 bg-green-600 text-white rounded">Report Flood</button>
              <button className="w-full p-2 bg-yellow-500 text-white rounded">Report Waste</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- src/pages/AdminDashboard.jsx ---------- */
import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminDashboard(){
  const [stats, setStats] = useState(null)
  useEffect(()=>{ api.get('/admin/dashboard/overview').then(r=>setStats(r.data)).catch(()=>{}) },[])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      {!stats ? <div>Loading...</div> : (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 shadow rounded"><div className="text-sm text-gray-500">Users</div><div className="text-xl font-bold">{stats.totalUsers}</div></div>
          <div className="bg-white p-4 shadow rounded"><div className="text-sm text-gray-500">Reports</div><div className="text-xl font-bold">{stats.totalReports}</div></div>
          <div className="bg-white p-4 shadow rounded"><div className="text-sm text-gray-500">Verified</div><div className="text-xl font-bold">{stats.totalVerified}</div></div>
          <div className="bg-white p-4 shadow rounded"><div className="text-sm text-gray-500">Active Devices</div><div className="text-xl font-bold">{stats.activeDevices}</div></div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Recent Alerts</h3>
        {/* Could add list of alerts with actions */}
      </div>
    </div>
  )
}

/* ---------- .env.local (example) ---------- */
// REACT_APP_MAPBOX_TOKEN=pk.your_mapbox_token_here
// REACT_APP_WEATHER_API_KEY=your_openweathermap_key

/* ---------- README snippet ---------- */
/*
1) Install
npm install

2) Run dev
npm run dev

3) Dev proxy: API requests to /api are proxied to http://localhost:4000 (see vite.config.js)

4) Backend endpoints required:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- GET /api/reports/heatmap
- GET /api/external/weather (proxy to OpenWeatherMap on server)
- GET /api/admin/dashboard/overview (admin-only)

Notes:
- The frontend uses localStorage tokens and automatic refresh via /api/auth/refresh.
- Mapbox requires a token in .env.local
*/
