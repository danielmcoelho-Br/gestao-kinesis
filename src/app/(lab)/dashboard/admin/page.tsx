"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    ShieldCheck,
    BarChart2,
    Settings,
    Database,
    ChevronRight,
    ArrowLeft,
    ClipboardList,
    UserCheck,
    Activity
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/lab/components/Header";

const adminCards = [
    {
        id: "assessments",
        title: "Avaliações & Templates",
        description: "Gerencie os modelos de avaliação disponíveis no sistema.",
        icon: ClipboardList,
        href: "/dashboard/admin/assessments",
        color: "#065F46",
        bg: "#D1FAE5"
    },
    {
        id: "stats",
        title: "Estatísticas Gerais",
        description: "Visão geral de uso da plataforma, avaliações realizadas e histórico.",
        icon: Activity,
        href: "#",
        color: "#92400E",
        bg: "#FEF3C7",
        comingSoon: true
    },
    {
        id: "settings",
        title: "Configurações do Sistema",
        description: "Personalize parâmetros globais da clínica e da plataforma.",
        icon: Settings,
        href: "#",
        color: "#6B21A8",
        bg: "#F3E8FF",
        comingSoon: true
    }
];

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const u = JSON.parse(savedUser);
            setUser(u);
            // Redirect if not admin
            if (!['ADMINISTRADOR', 'admin', 'administrator', 'ADMIN'].includes(u.role)) {
                router.replace("/dashboard");
            }
        } else {
            router.replace("/dashboard");
        }
    }, []);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>
            <div className="background-gradient" />
            <Header showBackButton />

            <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>
                {/* Header */}
                <div style={{ marginBottom: "3rem", marginTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                        <div style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "14px",
                            backgroundColor: "#FEE2E2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <ShieldCheck size={28} color="var(--primary)" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", margin: 0, color: "var(--text)" }}>
                                Painel de Administrador
                            </h1>
                            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                                Gerencie usuários, avaliações e configurações da plataforma.
                            </p>
                        </div>
                    </div>

                    {user && (
                        <div style={{
                            marginTop: "1.5rem",
                            padding: "1rem 1.5rem",
                            backgroundColor: "white",
                            border: "1px solid var(--border)",
                            borderRadius: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            fontSize: "0.9rem",
                            color: "var(--text-muted)"
                        }}>
                            <UserCheck size={18} color="var(--primary)" />
                            <span>Logado como <strong style={{ color: "var(--text)" }}>{user.name}</strong> — Função: <span style={{ color: "var(--primary)", fontWeight: "700" }}>{user.role}</span></span>
                        </div>
                    )}
                </div>

                {/* Admin Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1.25rem" }}>
                    {adminCards.map((card, i) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => !card.comingSoon && router.push(card.href)}
                            style={{
                                backgroundColor: "white",
                                border: "1px solid var(--border)",
                                borderRadius: "1.25rem",
                                padding: "1.75rem",
                                cursor: card.comingSoon ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "1.25rem",
                                opacity: card.comingSoon ? 0.7 : 1,
                                transition: "all 0.2s",
                                position: "relative",
                                overflow: "hidden"
                            }}
                            whileHover={!card.comingSoon ? {
                                scale: 1.01,
                                boxShadow: "var(--shadow-md)",
                                borderColor: card.color
                            } : {}}
                        >
                            <div style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "14px",
                                backgroundColor: card.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0
                            }}>
                                <card.icon size={26} color={card.color} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: "0 0 0.25rem", fontWeight: "700", color: "var(--text)", fontSize: "1.05rem" }}>
                                    {card.title}
                                </h3>
                                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: "1.5" }}>
                                    {card.description}
                                </p>
                            </div>

                            {card.comingSoon ? (
                                <span style={{
                                    fontSize: "0.7rem",
                                    fontWeight: "700",
                                    backgroundColor: "#FEF3C7",
                                    color: "#92400E",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "0.5rem",
                                    flexShrink: 0
                                }}>
                                    Em breve
                                </span>
                            ) : (
                                <ChevronRight size={20} color={card.color} style={{ flexShrink: 0 }} />
                            )}
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
