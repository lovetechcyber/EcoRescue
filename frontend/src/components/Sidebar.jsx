import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ role }) {
  const location = useLocation();
  const adminLinks = [
    { name: "Dashboard", to: "/admin" },
    { name: "Users", to: "/admin/users" },
    { name: "Reports", to: "/admin/reports" },
    { name: "Alerts", to: "/admin/alerts" },
    { name: "Sensors", to: "/admin/sensors" },
  ];
  const userLinks = [
    { name: "Dashboard", to: "/dashboard" },
    { name: "My Reports", to: "/dashboard/my-reports" },
    { name: "Submit Report", to: "/dashboard/submit" },
    { name: "Eco-Points", to: "/dashboard/eco-points" },
    { name: "Alerts", to: "/dashboard/alerts" },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <aside className="w-64 bg-white shadow h-screen flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">EcoRescue</h1>
      <nav className="flex flex-col gap-2">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`p-2 rounded hover:bg-gray-100 ${location.pathname === link.to ? "bg-gray-200 font-semibold" : ""}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
