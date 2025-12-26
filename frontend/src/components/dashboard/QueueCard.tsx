'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PauseCircle, CheckCircle, XCircle } from 'lucide-react';

interface QueueMember {
    name: string;      // SIP/8000
    status: string;    // Invalid, Not in use, In use...
    paused: boolean;
    callsTaken: number;
    callsMade?: number;
    lastCall?: string;
}

interface QueueProps {
    queueName: string;
    members: QueueMember[];
    callsWaiting: number;
}

export function QueueCard({ queueName, members, callsWaiting }: QueueProps) {

    // Helper to map status to color/icon
    const getStatusConfig = (member: QueueMember) => {
        // Priority to Pause
        if (member.paused) {
            return {
                color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                dot: 'bg-yellow-500',
                icon: <PauseCircle className="w-3.5 h-3.5" />,
                text: 'Pausa'
            };
        }

        const status = parseInt(member.status);

        // Map Asterisk Status to UI
        // 0=Idle, 1=InUse, 2=Busy, 4=Unavailable, 8=Ringing, 16=Hold
        switch (status) {
            case 1: // InUse
            case 2: // Busy
                return {
                    color: 'text-red-600 bg-red-50 border-red-200',
                    dot: 'bg-red-500',
                    icon: <Phone className="w-3.5 h-3.5" />,
                    text: 'Em Chamada'
                };
            case 8: // Ringing
                return {
                    color: 'text-blue-600 bg-blue-50 border-blue-200',
                    dot: 'bg-blue-500 animate-pulse',
                    icon: <PhoneIncoming className="w-3.5 h-3.5" />,
                    text: 'Chamando'
                };
            case 4: // Unavailable
            case 5:
                return {
                    color: 'text-gray-400 bg-gray-50 border-gray-100',
                    dot: 'bg-gray-300',
                    icon: <XCircle className="w-3.5 h-3.5" />,
                    text: 'Indisponível'
                };
            case 0: // Idle
            default:
                return {
                    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    dot: 'bg-emerald-500',
                    icon: <CheckCircle className="w-3.5 h-3.5" />,
                    text: 'Disponível'
                };
        }
    };

    return (
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200 rounded-xl overflow-hidden">
            {/* Header with Color Accent */}
            <div className={`h-1 w-full ${callsWaiting > 0 ? 'bg-red-500' : 'bg-blue-500'}`} />

            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-white border-b border-slate-50">
                <CardTitle className="text-base font-semibold text-slate-700 truncate" title={queueName}>
                    {queueName}
                </CardTitle>
                {callsWaiting > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs font-medium animate-pulse">
                        {callsWaiting} na fila
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/50 h-fit">
                {members.map((member) => {
                    const config = getStatusConfig(member);
                    return (
                        <div key={member.name} className={`
                            relative group flex flex-col items-start p-3 rounded-lg border bg-white
                            transition-all duration-200 hover:border-slate-300 hover:shadow-sm
                            ${config.color} border-l-4
                       `}>
                            <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-bold text-slate-800 text-sm truncate w-full" title={member.name || member.member}>
                                    {(member.name || member.member || '').replace(/^SIP\/|^PJSIP\//, '')}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-medium mt-1 opacity-90">
                                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                {config.text}
                            </div>

                            <div className="mt-2 w-full pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-medium space-x-2">
                                <div className="flex flex-col items-center flex-1 border-r border-slate-100 pr-1">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400">Atendidas</span>
                                    <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">
                                        {member.callsTaken}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center flex-1 pl-1">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400">Efetuadas</span>
                                    <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">
                                        {member.callsMade || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {members.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-6 text-slate-400">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <XCircle className="w-5 h-5 opacity-50" />
                        </div>
                        <span className="text-xs font-medium">Sem agentes logados</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
