require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function promoteSuperAdmin(email) {
    try {
        const res = await db.query('UPDATE users SET "isSuperAdmin" = 1 WHERE email = $1 RETURNING *', [email]);
        if (res.rows.length > 0) {
            console.log(`✓ ${email} has been promoted to Super Admin`);
            console.log(res.rows[0]);
        } else {
            console.log(`✗ User ${email} not found`);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

const email = process.argv[2] || 'admin@example.com';
promoteSuperAdmin(email);