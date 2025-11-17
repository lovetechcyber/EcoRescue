import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ phoneOrEmail: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      await login(form);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-96 p-6 rounded-xl shadow-lg"
      >
        <h1 className="text-2xl font-semibold mb-4">Login</h1>

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <input
          type="text"
          placeholder="Phone or Email"
          className="w-full p-2 border rounded mb-3"
          value={form.phoneOrEmail}
          onChange={(e) =>
            setForm({ ...form, phoneOrEmail: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-3"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>

        <a href="/register" className="text-blue-600 block mt-3 text-sm">
          Signup heren
        </a>

        <a href="/forgot-password" className="text-blue-600 block mt-3 text-sm">
          Forgot password?
        </a>
      </form>
    </div>
  );
}
