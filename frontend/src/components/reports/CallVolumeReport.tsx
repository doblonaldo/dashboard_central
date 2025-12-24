"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface CallVolumeData {
    dia: number;
    hora: number;
    total_chamadas: number;
}

export default function CallVolumeReport() {
    const [data, setData] = useState<CallVolumeData[]>([]);
    const [loading, setLoading] = useState(false);

    // Default to current month/year
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Current year + last 5 years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const res = await axios.get('http://localhost:3001/api/reports/volume', {
                params: { month, year },
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare data for grid view (optional improvement later, sticking to list/table for now)

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-100">Volumetria de Chamadas</h3>

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
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Dia</th>
                                <th className="p-4 font-medium">Hora</th>
                                <th className="p-4 font-medium text-right bg-slate-800/50 rounded-tr-lg rounded-tl-lg">Volume</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.length > 0 ? data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4 text-slate-300 font-medium">{item.dia}/{month}</td>
                                    <td className="p-4 text-slate-300">{item.hora}:00 - {item.hora}:59</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="font-bold text-white text-lg">{item.total_chamadas}</span>
                                            {/* Simple CSS Bar for quick visualization */}
                                            <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min((item.total_chamadas / Math.max(...data.map(d => d.total_chamadas))) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-slate-500">
                                        Nenhum dado encontrado para este período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
