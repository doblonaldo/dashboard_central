'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueCard } from './QueueCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';

interface DashboardState {
    queues: Record<string, any[]>;
    queueNames: Record<string, string>;
    stats: {
        callsWaiting: Record<string, number>;
    };
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export default function RealTimeDashboard() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [data, setData] = useState<DashboardState>({
        queues: {},
        queueNames: {},
        stats: { callsWaiting: {} },
        connectionStatus: 'connecting'
    });

    useEffect(() => {
        // Connect to Backend Socket.IO
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Connected to Real-time Hub');
            setData(prev => ({ ...prev, connectionStatus: 'connected' }));
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from Real-time Hub');
            setData(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        });

        // --- Event Listeners ---

        // Initial State Hydration
        newSocket.on('initial-state', (payload: any) => {
            console.log('📦 Initial State Received:', payload);
            setData(prev => ({
                ...prev,
                queues: payload.queues || {},
                queueNames: payload.queueNames || {},
                stats: payload.stats || { callsWaiting: {} }
            }));
        });

        // Extension Status Update
        newSocket.on('extension-update', (payload: any) => {
            // Logic to update specific member in the queue list
            // For now, we might not have the full mapping of Extension -> Queue, 
            // so we'd typically need an initial state fetch or a map.
            // Simplified: Update if found in existing queues
            console.log('Extension Update:', payload);
        });

        // Queue Member Update
        newSocket.on('queue-member-update', (payload: any) => {
            setData(prev => {
                const queueMembers = prev.queues[payload.queue] || [];
                // Check if member exists - payload.member is the extension (e.g. 9054)
                // We match against 'member' property which holds the extension
                const index = queueMembers.findIndex(m => m.member === payload.member);

                let newMembers;
                if (index >= 0) {
                    // Update
                    newMembers = [...queueMembers];
                    newMembers[index] = {
                        ...newMembers[index],
                        status: payload.status,
                        paused: payload.paused,
                        callsTaken: payload.callsTaken,
                        callsMade: payload.callsMade || newMembers[index].callsMade || 0,
                        lastCall: payload.lastCall
                    };
                } else {
                    // Add New
                    newMembers = [...queueMembers, {
                        member: payload.member, // ID (Extension)
                        name: payload.name || payload.member, // Display Name
                        status: payload.status,
                        paused: payload.paused,
                        callsTaken: payload.callsTaken || 0,
                        callsMade: payload.callsMade || 0,
                        lastCall: payload.lastCall
                    }];
                }

                return {
                    ...prev,
                    queues: {
                        ...prev.queues,
                        [payload.queue]: newMembers
                    }
                };
            });
        });

        // Queue Call Waiting Update
        newSocket.on('queue-call-enter', (payload: any) => {
            setData(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    callsWaiting: {
                        ...prev.stats.callsWaiting,
                        [payload.queue]: (payload.count || (prev.stats.callsWaiting[payload.queue] || 0) + 1)
                    }
                }
            }));
        });

        newSocket.on('queue-call-leave', (payload: any) => {
            setData(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    callsWaiting: {
                        ...prev.stats.callsWaiting,
                        [payload.queue]: (payload.count || Math.max(0, (prev.stats.callsWaiting[payload.queue] || 1) - 1))
                    }
                }
            }));
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    if (data.connectionStatus === 'connecting') {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-500">Conectando ao monitoramento...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                    Monitoramento em Tempo Real
                </h2>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${data.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-slate-500 capitalize">{data.connectionStatus === 'connected' ? 'Online' : 'Offline'}</span>
                </div>
            </div>

            {Object.keys(data.queues).length === 0 ? (
                <Alert>
                    <AlertTitle>Aguardando Dados</AlertTitle>
                    <AlertDescription>
                        Nenhuma informação de fila recebida ainda. Aguarde eventos do PABX.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(data.queues).map(([queueName, members]) => (
                        <QueueCard
                            key={queueName}
                            queueName={data.queueNames[queueName] || queueName}
                            members={members}
                            callsWaiting={data.stats.callsWaiting[queueName] || 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
