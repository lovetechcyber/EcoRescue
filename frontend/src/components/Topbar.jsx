import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-white shadow px-4 py-3 flex justify-between items-center">
      <span className="font-semibold text-lg">Welcome, {user?.fullName}</span>
      <button
        onClick={logout}
        className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
      >
        Logout
      </button>
    </header>
  );
}
