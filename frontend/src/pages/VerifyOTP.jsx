import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function VerifyOTP() {
  const { verifyOTP } = useContext(AuthContext);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await verifyOTP(phone, otp);
    } catch (err) {
      setError("Invalid OTP");
    }
  }

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <form className="bg-white w-96 p-6 rounded-xl shadow-lg" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold mb-4">Verify OTP</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Phone"
          className="w-full p-2 border rounded mb-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-2 border rounded mb-3"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Verify
        </button>
      </form>
    </div>
  );
}
