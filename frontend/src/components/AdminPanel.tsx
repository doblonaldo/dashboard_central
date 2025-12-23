"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { getApiUrl } from "@/utils/api";
import { X, Search, UserPlus, Lock, Unlock, Trash2, Key, RefreshCw, CheckCircle, Copy } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: number;
    createdAt: string;
}

interface Invite {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    token: string;
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

type TableRow = {
    id: string;
    type: 'USER' | 'INVITE';
    name: string;
    email: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
    createdAt: string;
    originalData: User | Invite;
};

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
                {children}
            </div>
        </div>
    );
};

export default function AdminPanel() {
    const [tableData, setTableData] = useState<TableRow[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("VIEWER");
    const [generatedLink, setGeneratedLink] = useState("");
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const token = Cookies.get("token");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, logsRes] = await Promise.all([
                axios.get(`${getApiUrl()}/users`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${getApiUrl()}/audit-logs`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const users = usersRes.data.users || [];
            const invites = usersRes.data.invites || [];

            const merged: TableRow[] = [
                ...users.map((u: User) => ({
                    id: u.id,
                    type: 'USER',
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    status: u.isActive ? 'ACTIVE' : 'BLOCKED',
                    createdAt: u.createdAt,
                    originalData: u
                })),
                ...invites.map((i: Invite) => ({
                    id: i.id,
                    type: 'INVITE',
                    name: '(Pendente)',
                    email: i.email,
                    role: i.role,
                    status: 'PENDING',
                    createdAt: i.createdAt,
                    originalData: i
                }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setTableData(merged);
            setLogs(logsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic
    const filteredData = tableData.filter(row =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteUser = async (id: string, type: 'USER' | 'INVITE') => {
        const message = type === 'USER'
            ? "Tem certeza que deseja excluir este usuário?"
            : "Tem certeza que deseja revogar este convite?";

        if (!confirm(message)) return;

        try {
            const endpoint = type === 'USER'
                ? `${getApiUrl()}/users/${id}`
                : `${getApiUrl()}/invites/${id}`;

            await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) {
            alert("Falha ao excluir item");
        }
    };

    const handleResetPassword = async (id: string) => {
        try {
            const res = await axios.post(`${getApiUrl()}/users/${id}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Link de redefinição gerado: ${res.data.link}`);
        } catch (err) {
            alert("Erro ao gerar link de redefinição");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
        const action = currentStatus ? "bloquear" : "desbloquear";
        if (!confirm(`Tem certeza que deseja ${action} o usuário ${name}?`)) return;

        try {
            await axios.patch(`${getApiUrl()}/users/${id}/status`,
                { isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (err) {
            alert(`Falha ao ${action} usuário`);
        }
    };

    const handleGenerateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setGeneratedLink("");
        try {
            const res = await axios.post(`${getApiUrl()}/invite/generate`,
                { email: inviteEmail, role: inviteRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGeneratedLink(res.data.link);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate invite");
        }
    };

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setCopied(true);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = generatedLink;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                setCopied(true);
            } catch (ex) {
                console.error("Falha ao copiar", ex);
                alert("Não foi possível copiar automaticamente. Por favor, selecione e copie manualmente.");
            }

            document.body.removeChild(textArea);
        }

        setTimeout(() => setCopied(false), 2000);
    };

    const closeModal = () => {
        setIsInviteModalOpen(false);
        setGeneratedLink("");
        setInviteEmail("");
        setError("");
        setCopied(false);
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
            {/* Header / Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Gerenciamento</h3>
                        <p className="text-sm text-slate-500">{filteredData.length} usuários encontrados</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar usuário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-900/20"
                    >
                        <UserPlus className="w-4 h-4" />
                        Novo Convite
                    </button>
                </div>
            </div>

            {/* Main Table Card - Agora também é flex-1 para dividir igualmente */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 shadow-sm">
                            <tr className="text-slate-400 text-sm uppercase tracking-wider border-b border-slate-800">
                                <th className="px-6 py-4 font-medium">Usuário</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Função</th>
                                <th className="px-6 py-4 font-medium">Data Cadastro</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredData.map(row => (
                                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${row.type === 'INVITE' ? 'text-slate-500 italic' : 'text-white'}`}>
                                                {row.name}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">{row.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                row.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {row.status === 'ACTIVE' ? 'Ativo' : row.status === 'PENDING' ? 'Pendente' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row.role === 'ADMIN'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {row.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(row.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {row.type === 'USER' && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleStatus(row.id, row.status === 'ACTIVE', row.name)}
                                                        className={`p-2 rounded-lg transition-colors ${row.status === 'ACTIVE'
                                                                ? 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10'
                                                                : 'text-orange-400 hover:text-green-400 hover:bg-green-500/10'
                                                            }`}
                                                        title={row.status === 'ACTIVE' ? "Bloquear" : "Desbloquear"}
                                                    >
                                                        {row.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(row.id)}
                                                        className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                                                        title="Resetar Senha"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDeleteUser(row.id, row.type)}
                                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                                        <Search className="w-8 h-8 opacity-20" />
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Logs - Agora flex-1 também para 50/50 */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col flex-1 min-h-0">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                        <RefreshCw className="w-4 h-4 text-orange-400" />
                        Logs do Sistema
                    </h3>
                </div>
                <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 font-medium w-32">Data</th>
                                <th className="px-4 py-2 font-medium w-48">Usuário</th>
                                <th className="px-4 py-2 font-medium w-32">Ação</th>
                                <th className="px-4 py-2 font-medium">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-800/20">
                                    <td className="px-4 py-2 text-slate-500 font-mono whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-2 text-slate-400">
                                        {log.userName || log.userEmail || 'Sistema'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${log.action.includes('DELETE') ? 'bg-red-950 text-red-400' :
                                                log.action.includes('BLOCK') ? 'bg-orange-950 text-orange-400' :
                                                    'bg-slate-800 text-slate-300'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500 truncate max-w-lg" title={log.details}>
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={closeModal} title="Gerar Novo Convite">
                <form onSubmit={handleGenerateInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email do Usuário</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Permissão</label>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        >
                            <option value="VIEWER">Usuário (Visualização)</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="TV">Modo TV</option>
                        </select>
                    </div>

                    {generatedLink ? (
                        <div className="p-4 bg-green-900/10 border border-green-900/30 rounded-lg animate-in fade-in zoom-in duration-300">
                            <p className="text-sm text-green-400 font-medium mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Link Gerado com Sucesso
                            </p>
                            <div className="flex flex-col gap-2">
                                <code className="block bg-black/40 p-3 rounded text-xs text-green-300 font-mono overflow-x-auto whitespace-nowrap scrollbar-hide select-all border border-green-900/20">
                                    {generatedLink}
                                </code>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className={`w-full py-2.5 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${copied
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                                            : 'bg-green-800/50 hover:bg-green-700/50 text-green-200'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copiar Link
                                        </>
                                    )}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setGeneratedLink(""); setInviteEmail(""); }}
                                className="mt-3 text-xs text-slate-500 hover:text-white underline w-full text-center"
                            >
                                Gerar outro convite
                            </button>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/20"
                        >
                            Gerar Link de Convite
                        </button>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm flex items-center gap-2">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
}
