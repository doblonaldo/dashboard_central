"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: number;
    createdAt: string;
}

interface Log {
    id: string;
    action: string;
    userName: string;
    userEmail: string;
    ipAddress: string;
    details: string;
    createdAt: string;
}

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("VIEWER");
    const [generatedLink, setGeneratedLink] = useState("");
    const [error, setError] = useState("");

    const token = Cookies.get("token");

    const fetchData = async () => {
        try {
            const [usersRes, logsRes] = await Promise.all([
                axios.get("http://localhost:3001/api/users", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("http://localhost:3001/api/audit-logs", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(usersRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`http://localhost:3001/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleGenerateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setGeneratedLink("");
        try {
            const res = await axios.post("http://localhost:3001/api/invite/generate",
                { email: inviteEmail, role: inviteRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGeneratedLink(res.data.link);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate invite");
        }
    };

    return (
        <div className="space-y-8 mt-8">
            {/* Invite Generator */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-white">Generate Invite</h3>
                <form onSubmit={handleGenerateInvite} className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Role</label>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                        >
                            <option value="VIEWER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="TV">TV</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
                        Generate Link
                    </button>
                </form>
                {generatedLink && (
                    <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded text-green-300">
                        <p className="font-semibold mb-1">Invite Link Generated:</p>
                        <code className="block bg-black/50 p-2 rounded break-all">{generatedLink}</code>
                    </div>
                )}
                {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>

            {/* Users List */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-white">Users</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-slate-500 uppercase bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-slate-800">
                                    <td className="px-4 py-3">{u.name}</td>
                                    <td className="px-4 py-3">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-white">System Logs</h3>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-slate-500 uppercase bg-slate-800/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Details</th>
                                <th className="px-4 py-3">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-slate-800">
                                    <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">{log.userName || log.userEmail || 'Unknown'}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                                    <td className="px-4 py-3">{log.details}</td>
                                    <td className="px-4 py-3 text-slate-500">{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
