import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.ISSABEL_DB_HOST || 'localhost',
    user: process.env.ISSABEL_DB_USER || 'root',
    password: process.env.ISSABEL_DB_PASSWORD || '',
    database: process.env.ISSABEL_DB_NAME || 'asterisk',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const query = async (sql: string, params: any[] = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('MySQL Query Error:', error);
        throw error;
    }
};

export const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to Issabel Database (MySQL)');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Issabel Database:', error);
        return false;
    }
};

export default pool;
