import { createContext, useState, useEffect } from "react";
import api from '../services/api'
import { useNavigate } from 'react-router-dom'


export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // LOGIN
  async function login(data) {
    const res = await api.post("/auth/login", data);
    localStorage.setItem("accessToken", res.data.tokens.accessToken);
    localStorage.setItem("refreshToken", res.data.tokens.refreshToken);
    setUser(res.data.user);
  }

  // REGISTER
  async function register(data) {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("accessToken", res.data.tokens.accessToken);
    localStorage.setItem("refreshToken", res.data.tokens.refreshToken);
    setUser(res.data.user);
  }

  // SEND OTP
  async function sendOTP(phone) {
    return await api.post("/auth/send-otp", { phone });
  }

  // VERIFY OTP
  async function verifyOTP(phone, otp) {
    const res = await api.post("/auth/verify-otp", { phone, otp });

    localStorage.setItem("accessToken", res.data.tokens.accessToken);
    localStorage.setItem("refreshToken", res.data.tokens.refreshToken);

    setUser(res.data.user);
  }

  // RESET PASSWORD
  async function resetPassword(phone, newPassword) {
    return await api.post("/auth/reset-password", { phone, newPassword });
  }

  // LOGOUT
  async function logout() {
    const refreshToken = localStorage.getItem("refreshToken");

    await api.post("/auth/logout", { refreshToken });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, sendOTP, verifyOTP, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}