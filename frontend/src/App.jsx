import React, { useContext } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Register from './pages/Signup'
import Login from './pages/Login'
import UserDashboard from './pages/UserDaasboard'
import AdminDashboard from './pages/AdminDashboard'
import PrivateRoute from './routes/PrivateRoute'
import { AuthContext } from './context/AuthContext'
import Header from './components/Hearder'
import ForgotPassword from './pages/ForgotPassword'


export default function App(){
const { user } = useContext(AuthContext)
return (
<div className="app-shell">
<Header />
<main className="flex-1">
<Routes>
<Route path="/" element={user ? <UserDashboard/> : <Login/>} />
<Route path="/register"  element={<Register/>} />
<Route path="/forgot-password" element={<ForgotPassword/>} />
<Route path="/login" element={<Login/>} />
<Route path="/dashboard" element={<PrivateRoute><UserDashboard/></PrivateRoute>} />
<Route path="/admin" element={<PrivateRoute><AdminDashboard/></PrivateRoute>} />
</Routes>
</main>
</div>
)
}