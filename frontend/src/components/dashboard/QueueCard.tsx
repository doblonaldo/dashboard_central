'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PauseCircle, CheckCircle, XCircle } from 'lucide-react';

interface QueueMember {
    member: string;    // Extension ID (e.g. 9000)
    name: string;      // SIP/8000 or Name
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
                borderColor: 'border-l-yellow-400',
                bgColor: 'bg-white',
                textColor: 'text-yellow-700',
                badgeColor: 'bg-yellow-100 text-yellow-800',
                icon: <PauseCircle className="w-4 h-4 text-yellow-500" />,
                text: 'Pausa',
                statusDot: 'bg-yellow-400'
            };
        }

        const status = parseInt(member.status);

        switch (status) {
            case 1: // InUse
            case 2: // Busy
                return {
                    borderColor: 'border-l-red-500',
                    bgColor: 'bg-red-50/10',
                    textColor: 'text-red-700',
                    badgeColor: 'bg-red-100 text-red-800',
                    icon: <Phone className="w-4 h-4 text-red-500" />,
                    text: 'Em Chamada',
                    statusDot: 'bg-red-500 animate-pulse'
                };
            case 8: // Ringing
                return {
                    borderColor: 'border-l-blue-500',
                    bgColor: 'bg-blue-50/10',
                    textColor: 'text-blue-700',
                    badgeColor: 'bg-blue-100 text-blue-800',
                    icon: <PhoneIncoming className="w-4 h-4 text-blue-500" />,
                    text: 'Chamando',
                    statusDot: 'bg-blue-500 animate-bounce'
                };
            case 4: // Unavailable
            case 5:
                return {
                    borderColor: 'border-l-slate-300',
                    bgColor: 'bg-slate-50',
                    textColor: 'text-slate-400',
                    badgeColor: 'bg-slate-100 text-slate-500',
                    icon: <XCircle className="w-4 h-4 text-slate-300" />,
                    text: 'Indisponível',
                    statusDot: 'bg-slate-300'
                };
            case 0: // Idle
            default:
                return {
                    borderColor: 'border-l-emerald-500',
                    bgColor: 'bg-white',
                    textColor: 'text-emerald-700',
                    badgeColor: 'bg-emerald-100 text-emerald-800',
                    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                    text: 'Disponível',
                    statusDot: 'bg-emerald-500'
                };
        }
    };

    return (
        <Card className="w-full shadow-sm rounded-xl bg-transparent flex flex-col h-full border-none shadow-none">
            {/* Header with Color Accent - only show if NOT red mode (to avoid double borders) */}
            {callsWaiting === 0 && (
                <div className="h-1.5 w-full rounded-t-xl bg-blue-600" />
            )}

            <CardHeader className={`
                flex flex-row items-center justify-between py-3 px-4 border-b shadow-sm 
                transition-colors duration-300
                ${callsWaiting > 0
                    ? 'bg-red-600 border-red-700 text-white rounded-t-xl'
                    : 'bg-white border-slate-200 border-x-0 border-t-0 text-slate-800 rounded-t-none'
                }
            `}>
                <CardTitle className="text-base font-bold truncate tracking-tight" title={queueName}>
                    {queueName}
                </CardTitle>
                {callsWaiting > 0 && (
                    <Badge className="ml-2 px-2 py-0.5 text-xs font-bold animate-pulse shadow-sm bg-white text-red-700 hover:bg-white/90">
                        {callsWaiting} na fila
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="p-0 pt-4 grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 bg-transparent h-fit content-start">
                {members.map((member) => {
                    const config = getStatusConfig(member);
                    return (
                        <div key={member.member} className={`
                            relative group flex flex-col justify-between p-3 rounded-xl border border-slate-200
                            bg-white shadow-sm hover:shadow-md transition-all duration-200
                            ${config.borderColor} border-l-[6px]
                       `}>
                            {/* Initials/Avatar Placeholder and Name */}
                            <div className="flex items-start justify-between w-full mb-2 gap-2">
                                <span className="font-bold text-slate-800 text-sm leading-tight line-clamp-2" title={member.name || member.member}>
                                    {(member.name || member.member || '').replace(/^SIP\/|^PJSIP\//, '')}
                                </span>
                            </div>

                            {/* Status Pill */}
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide w-fit mb-3 ${config.badgeColor}`}>
                                {config.text === 'Em Chamada' || config.text === 'Chamando' ? (
                                    <span className={`w-1.5 h-1.5 rounded-full ${config.statusDot}`} />
                                ) : null}
                                {config.text}
                            </div>

                            {/* Metrics Footer */}
                            <div className="w-full pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase text-slate-400 mb-0.5">Atendidas</span>
                                    <span className="text-slate-700 text-xs">
                                        {member.callsTaken}
                                    </span>
                                </div>
                                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] uppercase text-slate-400 mb-0.5">Efetuadas</span>
                                    <span className="text-slate-700 text-xs">
                                        {member.callsMade || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {members.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-slate-400 bg-white/50 rounded-lg border border-dashed border-slate-300 mx-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                            <XCircle className="w-6 h-6 opacity-30" />
                        </div>
                        <span className="text-sm font-medium">Nenhum agente logado</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
