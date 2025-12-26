import { query } from '../db/issabel';

export interface QueueMember {
    queueId: string;
    extension: string;
    name: string;
    interface: string; // Local/9000@from-queue/n
}

export interface Queue {
    id: string;
    name: string; // Description
    members: QueueMember[];
}

export class QueueService {

    /**
     * Fetches all queues and their static members from the database.
     * Returns a map of QueueID -> Queue Object
     */
    static async getQueuesStructuring(): Promise<Record<string, Queue>> {
        const queuesMap: Record<string, Queue> = {};

        try {
            // 1. Fetch Queues
            const queuesRows = await query(`
                SELECT extension, descr 
                FROM queues_config 
                ORDER BY extension
            `) as any[];

            queuesRows.forEach(row => {
                queuesMap[row.extension] = {
                    id: row.extension,
                    name: row.descr || `Fila ${row.extension}`,
                    members: []
                };
            });

            // 2. Fetch Members (Static)
            // Usually in queues_details with keyword='member' -> data='Local/9000@from-queue/n,0'
            const membersRows = await query(`
                SELECT id, data 
                FROM queues_details 
                WHERE keyword = 'member'
            `) as any[];

            // 3. Fetch User Names (Extensions)
            const usersRows = await query(`
                SELECT extension, name 
                FROM users
            `) as any[];

            const userMap = new Map<string, string>();
            usersRows.forEach(u => userMap.set(u.extension, u.name));

            // 4. Map Members to Queues
            membersRows.forEach(row => {
                const queueId = row.id;
                if (queuesMap[queueId]) {
                    // Start parsing data: "Local/9000@from-queue/n,0"
                    const dataParts = row.data.split(',');
                    const interfaceStr = dataParts[0]; // Local/9000@from-queue/n

                    // Extract extension: 9000
                    const match = interfaceStr.match(/[:/](\d+)@?/);
                    if (match) {
                        const extension = match[1];
                        const name = userMap.get(extension) || `Ramal ${extension}`;

                        queuesMap[queueId].members.push({
                            queueId,
                            extension,
                            name,
                            interface: interfaceStr
                        });
                    }
                }
            });

            return queuesMap;

        } catch (error) {
            console.error('Error fetching queue structure from DB:', error);
            return {};
        }
    }
}
