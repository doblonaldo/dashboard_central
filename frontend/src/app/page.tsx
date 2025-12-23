"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Loader2, AlertCircle, Monitor, User } from "lucide-react";
import Cookies from "js-cookie";

import { getApiUrl } from "@/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"user" | "tv">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${getApiUrl()}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Store token
      Cookies.set("token", token, { expires: 1 });
      Cookies.set("user", JSON.stringify(user), { expires: 1 });

      // Redirect based on intent
      if (activeTab === 'tv') {
        router.push("/dashboard/tv");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError("Credenciais inválidas. Verifique seu usuário e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950">
      {/* Left Side - Brand/Visuals */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-blue-900 to-slate-900 p-12 text-white">
        <div>
          {/* Logo Placeholder - Configurable later */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider">URA DAC Monitor</span>
          </div>
        </div>

        <div className="space-y-4">
          <blockquote className="text-2xl font-medium leading-relaxed">
            "Monitoramento em tempo real e gestão eficiente para sua central de atendimento Issabel."
          </blockquote>
          <p className="text-slate-400">Versão 1.0.0 (Beta)</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-950 px-8">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-white">Bem-vindo de volta</h1>
            <p className="mt-2 text-slate-400">Faça login para acessar o painel</p>
          </div>

          {/* Access Type Selector (Tabs) */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("user")}
              className={`flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "user"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <User className="h-4 w-4" />
              <span>Usuário</span>
            </button>
            <button
              onClick={() => setActiveTab("tv")}
              className={`flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "tv"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              <Monitor className="h-4 w-4" />
              <span>TV Mode</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <Input
                  type="email"
                  placeholder="admin@empresa.com"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
}
