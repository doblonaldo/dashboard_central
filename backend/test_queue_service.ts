
import { QueueService } from './src/services/queueService';

async function test() {
    console.log('Fetching queues...');
    const result = await QueueService.getQueuesStructuring();
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
}

test();
