import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function inspect() {
    const connection = await mysql.createConnection({
        host: process.env.ISSABEL_DB_HOST || 'localhost',
        user: process.env.ISSABEL_DB_USER || 'root',
        password: process.env.ISSABEL_DB_PASS || '',
        port: Number(process.env.ISSABEL_DB_PORT) || 3306,
        database: 'asterisk' // Explicitly targeting asterisk DB
    });

    try {
        console.log('Connected to asterisk DB.');
        const [rows] = await connection.execute("SHOW TABLES WHERE Tables_in_asterisk LIKE '%queue%' OR Tables_in_asterisk LIKE '%user%' OR Tables_in_asterisk LIKE '%device%'");
        console.log('Tables found:', rows);

        // If queues_config exists, describe it
        try {
            const [desc] = await connection.execute("DESCRIBE queues_config");
            console.log('\nDESCRIBE queues_config:', desc);
        } catch (e) { }

        // If queue_members exists, describe it
        try {
            const [desc] = await connection.execute("DESCRIBE queue_members");
            console.log('\nDESCRIBE queue_members:', desc);
        } catch (e) { }

        // If queues_details exists, describe it
        try {
            const [desc] = await connection.execute("DESCRIBE queues_details");
            console.log('\nDESCRIBE queues_details:', desc);
            const [rows] = await connection.execute("SELECT * FROM queues_details LIMIT 5");
            console.log('Sample queues_details:', rows);
        } catch (e) { console.log('queues_details table not found'); }

        // Check users table
        try {
            const [desc] = await connection.execute("DESCRIBE users");
            console.log('\nDESCRIBE users:', desc);
            const [rows] = await connection.execute("SELECT extension, name FROM users LIMIT 5");
            console.log('Sample users:', rows);
        } catch (e) { console.log('users table not found'); }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

inspect();
