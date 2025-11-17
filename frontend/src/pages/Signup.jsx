import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-96 p-6 rounded-xl shadow-lg"
      >
        <h1 className="text-2xl font-semibold mb-4">Register</h1>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 border rounded mb-3"
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />

        <input
          type="text"
          placeholder="Phone Number"
          className="w-full p-2 border rounded mb-3"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-3"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-3"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
    </div>
  );
}
