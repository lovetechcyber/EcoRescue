import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ForgotPassword() {
  const { sendOTP } = useContext(AuthContext);
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await sendOTP(phone);
    setMsg("OTP sent to your phone");
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form className="bg-white w-96 p-6 rounded-xl shadow-lg" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>

        {msg && <p className="text-green-600 text-sm">{msg}</p>}

        <input
          type="text"
          placeholder="Phone Number"
          className="w-full p-2 border rounded mb-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Send OTP
        </button>
      </form>
    </div>
  );
}
