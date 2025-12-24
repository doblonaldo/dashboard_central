import Database = require('better-sqlite3');
import * as dotenv from 'dotenv';
dotenv.config();

const db = new Database('dev.db', { verbose: console.log });

export { db };
