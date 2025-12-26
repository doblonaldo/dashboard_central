"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

    // Transform data for chart if needed (e.g. combine day/hour for axis)
    const chartData = data.map(item => ({
        ...item,
        label: `${item.dia}/${month} ${item.hora}h`
    }));

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-slate-100">Volumetria de Chamadas (Por Hora)</h3>

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
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" hide />
                            <YAxis stroke="#94a3b8" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                itemStyle={{ color: '#60a5fa' }}
                            />
                            <Area type="monotone" dataKey="total_chamadas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCalls)" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-center text-xs text-slate-500 mt-2">Distribuição de chamadas ao longo do mês</p>
                </div>
            )}
        </div>
    );
}
