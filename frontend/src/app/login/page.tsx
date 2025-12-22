"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post("http://localhost:3001/api/auth/login", {
                email,
                password,
            });

            const { token, user } = response.data;

            // Store token in cookie
            Cookies.set("token", token, { expires: 1 }); // 1 day
            Cookies.set("user", JSON.stringify(user), { expires: 1 });

            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError("Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-sm space-y-6 rounded-xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="rounded-full bg-blue-600 p-3">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-slate-400">
                        Enter your credentials to access the dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <Input
                                type="email"
                                placeholder="nome@empresa.com"
                                className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-600"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-950/20 p-2 rounded border border-red-900/50">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
