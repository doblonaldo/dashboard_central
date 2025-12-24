"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { getApiUrl } from "@/utils/api";
import { Star, Calendar, Download, Search, Filter } from "lucide-react";

interface AgentStat {
    ramal: string;
    nome_atendente: string;
    media_notas: number;
    total_avaliacoes: number;
}

export default function SatisfactionReport() {
    const [stats, setStats] = useState<AgentStat[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");

    const token = Cookies.get("token");

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${getApiUrl()}/reports/satisfaction`, {
                params: { month, year },
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch report", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const filteredStats = stats.filter(stat =>
    (stat.nome_atendente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stat.ramal?.includes(searchTerm))
    );

    // Sort by Grade DESC
    const sortedStats = [...filteredStats].sort((a, b) => b.media_notas - a.media_notas);

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] gap-6">

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">

                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-transparent text-white text-sm outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                        >
                            {months.map((m, idx) => (
                                <option key={idx} value={idx + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent text-white text-sm outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar atendente ou ramal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={fetchReport}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                    <Filter className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Stats Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 shadow-sm">
                            <tr className="text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800">
                                <th className="px-6 py-4 font-medium w-24 text-center">Ranking</th>
                                <th className="px-6 py-4 font-medium">Atendente</th>
                                <th className="px-6 py-4 font-medium w-32 text-center">Ramal</th>
                                <th className="px-6 py-4 font-medium text-right">Média</th>
                                <th className="px-6 py-4 font-medium text-right">Avaliações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                        Carregando dados...
                                    </td>
                                </tr>
                            ) : sortedStats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                                        <Search className="w-8 h-8 opacity-20" />
                                        Nenhum registro encontrado para este período.
                                    </td>
                                </tr>
                            ) : (
                                sortedStats.map((stat, index) => (
                                    <tr key={stat.ramal + index} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                    index === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                                                        index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                                                            'text-slate-500'}`}
                                            >
                                                {index + 1}º
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{stat.nome_atendente}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400 font-mono">
                                            {stat.ramal}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className={`text-lg font-bold ${stat.media_notas >= 4.5 ? 'text-green-400' :
                                                    stat.media_notas >= 3 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {Number(stat.media_notas).toFixed(1)}
                                                </span>
                                                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-400">
                                            {stat.total_avaliacoes}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
