"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Suspense } from 'react';

function InviteForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token de convite inválido ou ausente.");
        }
    }, [token]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setLoading(false);
            return;
        }

        try {
            await axios.post("http://localhost:3001/api/invite/accept", {
                token,
                name,
                password
            });

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || "Falha ao registrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-green-500/20 p-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white">Cadastro Realizado!</h1>
                <p className="text-slate-400">Você será redirecionado para o login em instantes...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Finalizar Cadastro</h1>
                <p className="mt-2 text-slate-400">Defina seu nome e senha para acessar</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Seu Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Douglas Costa"
                            className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Defina uma Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Confirme a Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-lg shadow-blue-900/20"
                    disabled={loading || !token}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        "Criar Conta"
                    )}
                </Button>
            </form>
        </div>
    );
}

export default function InvitePage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4">
            <Suspense fallback={<div className="text-white">Carregando...</div>}>
                <InviteForm />
            </Suspense>
        </div>
    );
}
