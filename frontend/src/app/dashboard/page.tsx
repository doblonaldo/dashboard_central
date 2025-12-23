"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import AdminPanel from "@/components/AdminPanel";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string, role: string } | null>(null);

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

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="text-right">
                    <p>Welcome, <span className="text-blue-400 font-semibold">{user.name}</span></p>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">{user.role}</span>
                </div>
            </div>

            {user.role === 'ADMIN' && <AdminPanel />}

            {/* General Dashboard Content (Metrics, etc.) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-medium text-slate-300">Active Sessions</h3>
                    <p className="text-3xl font-bold text-white mt-2">1</p>
                </div>
                {/* More cards later */}
            </div>
        </div>
    );
}
