import { Server as SocketIOServer } from 'socket.io';
import { QueueService } from './queueService';
import { StatsService } from './statsService';
import * as fs from 'fs';
import * as path from 'path';
const AMI = require('asterisk-manager');

export class AMIService {
    private ami: any;
    private io: SocketIOServer;
    // Store latest state: QueueID -> Map<MemberID, MemberData>
    private queueState: Map<string, Map<string, any>> = new Map();
    private queueNames: Map<string, string> = new Map();
    private extensionState: Map<string, any> = new Map();
    private logStream: fs.WriteStream;

    constructor(io: SocketIOServer) {
        this.io = io;

        // Initialize Logger
        const logPath = path.join(process.cwd(), 'ami_events.log');
        this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
        console.log(`📝 AMI Logging enabled: ${logPath}`);

        // Initialize State from DB
        StatsService.init();
        this.initializeState();

        // Initialize AMI Connection
        this.ami = new AMI(
            process.env.AMI_PORT || '5038',
            process.env.AMI_HOST || '177.74.144.22',
            process.env.AMI_USER || 'monitor_ura',
            process.env.AMI_PASS || 'monitor_ura'
        );

        this.setupEventHandlers();

        // Connect
        this.ami.keepConnected();
    }

    private logEvent(eventName: string, data: any) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${eventName}] ${JSON.stringify(data)}\n`;
        this.logStream.write(logEntry);
    }

    private async initializeState() {
        try {
            console.log('🔄 Hydrating Queue State from DB...');
            const queues = await QueueService.getQueuesStructuring();
            const dailyStats = StatsService.getDailyStats();

            Object.values(queues).forEach(queue => {
                const membersMap = new Map();
                queue.members.forEach(member => {
                    membersMap.set(member.extension, {
                        queue: queue.id,
                        member: member.extension,
                        name: member.name,
                        status: '4', // Default to Unavailable (Indisponível) until verified
                        paused: false,
                        callsTaken: 0,
                        callsMade: dailyStats.get(member.extension) || 0,
                        timestamp: new Date().toISOString()
                    });
                });
                this.queueState.set(queue.id, membersMap);
                this.queueNames.set(queue.id, queue.name || `Fila ${queue.id}`);
            });
            console.log(`✅ State Hydrated: ${Object.keys(queues).length} queues loaded.`);

            // Emit updated state to all connected clients immediately after hydration
            const queuesData: Record<string, any[]> = {};
            this.queueState.forEach((members, queueId) => {
                queuesData[queueId] = Array.from(members.values());
            });

            this.io.emit('initial-state', {
                queues: queuesData,
                queueNames: Object.fromEntries(this.queueNames),
                stats: { callsWaiting: {} }
            });

            // Trigger Status Update for each queue individually
            console.log('🔄 Triggering individual QueueStatus requests...');
            const triggerQueueStatus = () => {
                this.queueState.forEach((_, queueId) => {
                    this.ami.action({
                        action: 'QueueStatus',
                        queue: queueId
                    });
                });
            };

            // Initial Trigger
            triggerQueueStatus();

            // Periodic Safety Check (every 60s)
            setInterval(() => {
                console.log('⏰ Running Periodic Safety Check (60s)...');
                triggerQueueStatus();
            }, 60000);

        } catch (error) {
            console.error('❌ Failed to hydrate state:', error);
        }
    }

    private setupEventHandlers() {
        this.ami.on('connect', () => {
            console.log('✅ Connected to Asterisk AMI');
            // Re-trigger queue status on reconnect
            if (this.queueState.size > 0) {
                this.queueState.forEach((_, queueId) => {
                    this.ami.action({
                        action: 'QueueStatus',
                        queue: queueId
                    });
                });
            }
        });

        this.ami.on('error', (err: any) => {
            console.error('❌ AMI Error:', err);
        });

        // Send initial state to new clients
        this.io.on('connection', (socket) => {
            console.log('🔌 Client connected. Sending latest state...');

            const queuesData: Record<string, any[]> = {};
            this.queueState.forEach((members, queueId) => {
                queuesData[queueId] = Array.from(members.values());
            });

            socket.emit('initial-state', {
                queues: queuesData,
                queueNames: Object.fromEntries(this.queueNames),
                stats: { callsWaiting: {} }
            });
        });

        // ... (rest of listeners)

        // --- Outgoing Calls (DialEnd) ---
        // Event: DialEnd
        // Privileges: call, all
        this.ami.on('dialend', (evt: any) => {
            console.log('Detected DialEnd:', evt);
            // Only count answered calls
            if (evt.dialstatus !== 'ANSWER') return;

            // IGNORE internal queue distributions
            // Contexts usually associated with queue distribution:
            const ignoreContexts = ['from-queue', 'ext-queues', 'macro-dial-one', 'from-internal-xfer'];
            if (ignoreContexts.includes(evt.context) || ignoreContexts.includes(evt.destcontext)) {
                console.log(`Ignoring Queue/Internal DialEnd: ${evt.context} -> ${evt.destcontext}`);
                return;
            }

            // Filter logic: Only count if context suggests outgoing call 
            // (often 'macro-dialout-trunk' or 'from-internal' to external)
            // But 'from-internal' can be internal calls too.
            // Strongest indicator for outgoing usually involves 'macro-dialout-trunk'.

            // Safer check: If it's NOT in the ignore list, we count it, but maybe verify destchannel isn't local?
            // For now, strict exclusion of queue contexts should solve the "double count" issue.

            // Channel: PJSIP/2001-00000001 or SIP/2001-00000001
            // We need to extract '2001'
            // Some Asterisk versions use 'Channel', others 'channel'.
            const channel = evt.channel || evt.Channel;

            if (!channel) {
                console.warn('⚠️ DialEnd event missing channel. Keys:', Object.keys(evt));
                return;
            }

            const match = channel.match(/[:/](\d+)/);
            if (!match) return;
            const extension = match[1];

            console.log(`Intercepted outgoing call from ${extension}`);

            // Find this extension in queues and update
            this.queueState.forEach((members, queueId) => {
                if (members.has(extension)) {
                    const member = members.get(extension);
                    StatsService.incrementCallsMade(extension); // Persist
                    member.callsMade = (member.callsMade || 0) + 1;
                    member.timestamp = new Date().toISOString();

                    members.set(extension, member);

                    console.log(`Updated callsMade for ${extension} in queue ${queueId}: ${member.callsMade}`);

                    this.io.emit('queue-member-update', {
                        ...member,
                        status: member.status // ensure status is sent
                    });
                }
            });
        });

        // --- Extension Status (Device State) ---
        // Event: ExtensionStatus
        // Privileges: call, all
        // --- Extension Status (Device State) ---
        // Event: ExtensionStatus
        // Privileges: call, all
        this.ami.on('extensionstatus', (evt: any) => {
            // evt.exten (Extension)
            // evt.statustext (Idle, InUse, Busy, etc.)
            // evt.status (Numeric code)

            // Normalize Status Text
            let statusText = 'Disponível';
            const statusCode = parseInt(evt.status);

            switch (statusCode) {
                case 1: statusText = 'Em Chamada'; break; // InUse
                case 2: statusText = 'Ocupado'; break; // Busy
                case 4: statusText = 'Indisponível'; break; // Unavailable
                case 8: statusText = 'Chamando'; break; // Ringing
                case 16: statusText = 'Em Espera'; break; // On Hold
                case 0: statusText = 'Disponível'; break; // Idle
                default: statusText = evt.statustext;
            }

            // Update this extension in ALL queues
            this.queueState.forEach((members, queueId) => {
                if (members.has(evt.exten)) {
                    const member = members.get(evt.exten);

                    // Update State
                    member.status = statusCode.toString();
                    member.timestamp = new Date().toISOString();
                    member.statusText = statusText; // Store text

                    // Update Map
                    members.set(evt.exten, member);

                    // Emit to Frontend
                    this.io.emit('queue-member-update', {
                        queue: queueId,
                        member: evt.exten,
                        name: member.name,
                        status: statusCode.toString(),
                        statusText: statusText, // Send human readable
                        paused: member.paused,
                        callsTaken: member.callsTaken,
                        callsMade: member.callsMade || 0,
                        lastCall: member.lastCall
                    });
                }
            });
        });

        // --- Device State Change ---
        // Event: DeviceStateChange
        // Privileges: call, all
        this.ami.on('devicestatechange', (evt: any) => {
            // evt.device (PJSIP/9008)
            // evt.state (NOT_INUSE, INUSE, BUSY, RINGING, UNAVAILABLE)

            // Ignore Local channels (virtual channels from queues/fwd)
            // We only want physical device states (SIP, PJSIP, IAX, DAHDI)
            if (evt.device.startsWith('Local/')) return;

            // Extract extension
            const match = evt.device.match(/[:/](\d+)/);
            if (!match) return;
            const extension = match[1];

            // Normalize Status
            let statusCode = '0';
            let statusText = 'Disponível';

            switch (evt.state) {
                case 'INUSE': statusCode = '1'; statusText = 'Em Chamada'; break;
                case 'BUSY': statusCode = '2'; statusText = 'Ocupado'; break;
                case 'UNAVAILABLE': statusCode = '4'; statusText = 'Indisponível'; break;
                case 'RINGING': statusCode = '8'; statusText = 'Chamando'; break;
                case 'ONHOLD': statusCode = '16'; statusText = 'Em Espera'; break;
                case 'NOT_INUSE': statusCode = '0'; statusText = 'Disponível'; break;
                default: statusText = evt.state;
            }

            // Update this extension in ALL queues
            this.queueState.forEach((members, queueId) => {
                if (members.has(extension)) {
                    const member = members.get(extension);

                    // Update State
                    member.status = statusCode;
                    member.statusText = statusText;
                    member.timestamp = new Date().toISOString();

                    // Update Map
                    members.set(extension, member);

                    // Emit to Frontend
                    this.io.emit('queue-member-update', {
                        queue: queueId,
                        member: extension,
                        name: member.name,
                        status: statusCode,
                        statusText: statusText,
                        paused: member.paused,
                        callsTaken: member.callsTaken,
                        callsMade: member.callsMade || 0,
                        lastCall: member.lastCall
                    });
                }
            });
        });

        // --- Queue Member Status ---
        // --- Queue Member Status & Queue Member (from QueueStatus action) ---
        const handleQueueMember = (evt: any) => {
            // Extract real extension
            let extension = evt.membername;
            if (evt.stateinterface) {
                const match = evt.stateinterface.match(/[:/](\d+)@?/);
                if (match) extension = match[1];
            } else if (evt.interface) {
                const match = evt.interface.match(/[:/](\d+)@?/);
                if (match) extension = match[1];
            }

            // Preserve existing name if known
            let displayName = evt.membername;
            let currentCallsMade = 0;
            const currentQueueState = this.queueState.get(evt.queue);
            if (currentQueueState && currentQueueState.has(extension)) {
                const data = currentQueueState.get(extension);
                displayName = data.name;
                currentCallsMade = data.callsMade || 0;
            }

            // Normalization of status code
            // QueueMember Status: 1=Not in use (Idle), 2=In use, 3=Busy, 4=Invalid, 5=Unavailable, 6=Ringing
            // Target (ExtensionStatus): 0=Idle, 1=In use, 2=Busy, 4=Unavailable, 8=Ringing
            let rawStatus = parseInt(evt.status);
            let statusCode = '4'; // Default Unavailable

            switch (rawStatus) {
                case 1: statusCode = '0'; break; // Not in use -> Idle
                case 2: statusCode = '1'; break; // In use -> In use
                case 3: statusCode = '2'; break; // Busy -> Busy
                case 4: statusCode = '4'; break; // Invalid -> Unavailable
                case 5: statusCode = '4'; break; // Unavailable -> Unavailable
                case 6: statusCode = '8'; break; // Ringing -> Ringing
                default: statusCode = '4';
            }

            const payload = {
                queue: evt.queue,
                member: extension,
                name: displayName,
                paused: evt.paused === '1',
                status: statusCode,
                callsTaken: parseInt(evt.callstaken || '0'),
                callsMade: currentCallsMade,
                lastCall: parseInt(evt.lastcall || '0'),
                timestamp: new Date().toISOString()
            };

            // Persist state
            if (!this.queueState.has(evt.queue)) {
                this.queueState.set(evt.queue, new Map());
            }
            this.queueState.get(evt.queue)?.set(extension, payload);

            this.io.emit('queue-member-update', payload);
        };

        this.ami.on('queuememberstatus', handleQueueMember);
        this.ami.on('queuemember', handleQueueMember);

        // --- Queue Caller Info ---
        // Event: QueueCallerJoin / Leave
        // Capture waiting calls
        this.ami.on('queuecallerjoin', (evt: any) => {
            this.io.emit('queue-call-enter', {
                queue: evt.queue,
                count: evt.count, // Some asterisk versions send current count
                caller: evt.calleridnum
            });
        });

        this.ami.on('queuecallerleave', (evt: any) => {
            this.io.emit('queue-call-leave', {
                queue: evt.queue,
                count: evt.count
            });
        });

        // --- Pause/Unpause Events (for strict pause monitoring) --
        this.ami.on('queuememberpaused', (evt: any) => {
            this.io.emit('agent-pause', {
                member: evt.membername,
                queue: evt.queue,
                paused: true,
                reason: evt.reason || 'Pausa', // Requires reason functionality
                timestamp: new Date().toISOString()
            });
        });

        this.ami.on('close', () => console.log('⚠️ AMI Connection Closed'));
        this.ami.on('disconnect', () => console.log('⚠️ AMI Disconnected'));
        this.ami.on('response', (evt: any) => console.log('AMI Response:', evt));
    }

    public disconnect() {
        if (this.ami) {
            this.ami.disconnect();
        }
    }
}
