"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import AdminPanel from "@/components/AdminPanel";
import SatisfactionReport from "@/components/SatisfactionReport";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string, role: string } | null>(null);

    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const token = Cookies.get("token");
        const storedUser = Cookies.get("user");

        if (!token) {
            router.push("/login");
            return;
        }

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    const handleLogout = () => {
        Cookies.remove("token");
        Cookies.remove("user");
        router.push("/login");
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-slate-950 text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold tracking-tight text-blue-500">
                        URA DAC <span className="text-white">Monitor</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${activeTab === "overview"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Visão Geral
                    </button>

                    {user.role === 'ADMIN' && (
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${activeTab === "users"
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Painel de Usuários
                        </button>
                    )}
                </nav>

                {/* Reports Section */}
                <div className="px-4 py-2 mt-2">
                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Relatórios</p>
                    <button
                        onClick={() => setActiveTab("satisfaction-report")}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 text-sm ${activeTab === "satisfaction-report"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Análise de Notas
                    </button>
                </div>



                <div className="p-4 border-t border-slate-800 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sair do Sistema
                    </button>

                    <div className="flex items-center gap-3 px-4 pt-2 border-t border-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {activeTab === "overview" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-100">Visão Geral</h2>
                            <p className="text-slate-400 mt-1">Monitoramento em tempo real do sistema</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                <h3 className="text-sm font-medium text-slate-400 group-hover:text-blue-400 transition-colors">Sessões Ativas</h3>
                                <p className="text-3xl font-bold text-white mt-2">1</p>
                            </div>
                            {/* Add more metric cards here */}
                        </div>
                    </div>
                )}

                {activeTab === "users" && user.role === 'ADMIN' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-100">Gerenciamento de Usuários</h2>
                            <p className="text-slate-400 mt-1">Administre acessos e convites da plataforma</p>
                        </header>
                        <AdminPanel />
                    </div>
                )}

                {activeTab === "satisfaction-report" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-100">Análise de Performance</h2>
                                <p className="text-slate-400 mt-1">Indicadores de qualidade e satisfação por ramal</p>
                            </div>
                            {/* Logo Placeholder */}
                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-slate-900 font-bold text-xs">LOGO</span>
                            </div>
                        </header>
                        <SatisfactionReport />
                    </div>
                )}
            </main>
        </div>
    );
}
