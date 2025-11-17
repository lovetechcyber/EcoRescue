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