"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface ProductivityData {
    ramal: string;
    nome_agente: string;
    atendidas: number;
    nao_atendidas: number;
    falhas: number;
    total_geral: number;
}

interface PauseData {
    agente: string;
    motivo_pausa: string;
    tempo_total_pausa_segundos: number;
}

export default function ProductivityReport() {
    const [prodData, setProdData] = useState<ProductivityData[]>([]);
    const [pauseData, setPauseData] = useState<PauseData[]>([]);
    const [loading, setLoading] = useState(false);

    // Default to current month/year
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [view, setView] = useState<'calls' | 'pauses'>('calls');

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Current year + last 5 years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchData();
    }, [month, year, view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (view === 'calls') {
                const res = await axios.get('http://localhost:3001/api/reports/productivity', {
                    params: { month, year }, headers
                });
                setProdData(res.data);
            } else {
                const res = await axios.get('http://localhost:3001/api/reports/pauses', { headers });
                setPauseData(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-slate-100">Produtividade de Operadores</h3>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setView('calls')}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${view === 'calls' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Chamadas
                        </button>
                        <button
                            onClick={() => setView('pauses')}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${view === 'pauses' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Pausas (QueueLog)
                        </button>
                    </div>
                </div>

                {view === 'calls' && (
                    <div className="flex gap-2">
                        <div className="relative">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="bg-slate-800 text-white text-sm outline-none cursor-pointer py-2 pl-3 pr-8 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors appearance-none [&>option]:bg-slate-900"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-slate-800 text-white text-sm outline-none cursor-pointer py-2 pl-3 pr-8 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors appearance-none [&>option]:bg-slate-900"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {view === 'calls' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">Agente</th>
                                    <th className="p-4 font-medium text-center text-green-400">Atendidas</th>
                                    <th className="p-4 font-medium text-center text-yellow-400">Não Atendidas</th>
                                    <th className="p-4 font-medium text-center text-red-400">Falhas</th>
                                    <th className="p-4 font-medium text-right font-bold text-white">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {prodData.length > 0 ? prodData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-white">{item.nome_agente}</div>
                                            <div className="text-xs text-slate-500">Ramal {item.ramal}</div>
                                        </td>
                                        <td className="p-4 text-center font-mono text-slate-300">{item.atendidas}</td>
                                        <td className="p-4 text-center font-mono text-slate-300">{item.nao_atendidas}</td>
                                        <td className="p-4 text-center font-mono text-slate-300">{item.falhas}</td>
                                        <td className="p-4 text-right font-bold text-lg text-white">{item.total_geral}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            Nenhum dado encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">Agente</th>
                                    <th className="p-4 font-medium">Motivo da Pausa</th>
                                    <th className="p-4 font-medium text-right">Duração Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {pauseData.length > 0 ? pauseData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-medium text-white">{item.agente}</td>
                                        <td className="p-4 text-slate-300">{item.motivo_pausa || 'Não especificado'}</td>
                                        <td className="p-4 text-right font-mono text-blue-400">
                                            {formatTime(item.tempo_total_pausa_segundos)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="p-12 text-center text-slate-500">
                                            Nenhuma pausa registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
