"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, LogOut, Shield } from "lucide-react";

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={{
      backgroundColor: "white",
      borderBottom: "1px solid #e2e8f0",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          backgroundColor: "#8b5cf6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white"
        }}>
          <Shield size={20} />
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          Kinesis<span style={{ color: "#8b5cf6" }}>Adm</span>
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button 
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#64748b",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          <Home size={18} />
          <span>Central Hub</span>
        </button>

        <div style={{ height: "20px", width: "1px", backgroundColor: "#e2e8f0" }} />

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0 }}>{user.role}</p>
            </div>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#f5f3ff",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "0.95rem"
            }}>
              {user.name ? user.name[0].toUpperCase() : "A"}
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#ef4444",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.9rem"
          }}
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
