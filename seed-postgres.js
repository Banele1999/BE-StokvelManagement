require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function seed() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    
    console.log("--- Initializing PostgreSQL Seed ---");

    try {
        // 1. Clean Database
        console.log('Cleaning database...');
        await db.query('DELETE FROM notifications');
        await db.query('DELETE FROM payments');
        await db.query('DELETE FROM group_members');
        await db.query('DELETE FROM stokvel_groups');
        await db.query('DELETE FROM users');

        // 2. Create TestGroup
        console.log('Creating test group...');
        const groupRes = await db.query(
            'INSERT INTO stokvel_groups (name, description, "groupBalance", "monthlyTarget", "yearlyTarget", "createdAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            ['TestGroup', 'Official Testing Group', 0, 10000, 120000, now.toISOString()]
        );
        const groupId = groupRes.rows[0].id;

        // 3. Create 10 Members
        console.log('Creating test members...');
        const memberConfigs = [
            { name: 'TestAdmin', email: 'testadmin@test.com', role: 'Admin', contrib: 1000 },
            { name: 'MusaAdmin', email: 'musaadmin@test.com', role: 'Admin', contrib: 1000 },
            { name: 'MusaTest', email: 'musatest@test.com', role: 'Member', contrib: 1000 },
            { name: 'John Test', email: 'john@test.com', role: 'Member', contrib: 1000 },
            { name: 'Sarah Test', email: 'sarah@test.com', role: 'Member', contrib: 1000 },
            { name: 'David Test', email: 'david@test.com', role: 'Member', contrib: 1000 },
            { name: 'Emma Test', email: 'emma@test.com', role: 'Member', contrib: 1000 },
            { name: 'Peter Test', email: 'peter@test.com', role: 'Member', contrib: 1000 },
            { name: 'Linda Test', email: 'linda@test.com', role: 'Member', contrib: 1000 },
            { name: 'Banele Test', email: 'banele@test.com', role: 'Member', contrib: 1000 },
        ];

        const userIds = [];
        for (const m of memberConfigs) {
            const joinDate = '2025-01-01T08:00:00.000Z';
            const userRes = await db.query(
                'INSERT INTO users (name, email, password, phone, "monthlyContribution", "monthlyTarget", "yearlyTarget", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [m.name, m.email, hashedPassword, '0123456789', m.contrib, m.contrib, m.contrib * 12, joinDate]
            );
            const userId = userRes.rows[0].id;
            userIds.push(userId);
            
            await db.query(
                'INSERT INTO group_members ("groupId", "userId", role) VALUES ($1, $2, $3)',
                [groupId, userId, m.role]
            );
        }

        // 4. Generate Payments
        console.log('Generating payment history...');
        let groupTotalVerified = 0;
        const startDate = new Date(2025, 0, 1);
        const endDate = new Date();

        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
            const monthStr = d.toISOString().slice(0, 7);
            
            for (let i = 0; i < memberConfigs.length; i++) {
                const m = memberConfigs[i];
                const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                const status = isCurrentMonth ? 'pending' : 'verified';
                const amount = m.contrib;
                const payDate = d.toISOString();
                const ref = `Contrib-${monthStr}`;

                await db.query(
                    'INSERT INTO payments ("userId", "groupId", amount, method, date, status, reference, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [userIds[i], groupId, amount, 'EFT', payDate, status, ref, now.toISOString()]
                );
                
                if (status === 'verified') {
                    groupTotalVerified += amount;
                }
            }
        }

        // 5. Update Group Balance
        await db.query('UPDATE stokvel_groups SET "groupBalance" = $1 WHERE id = $2', [groupTotalVerified, groupId]);

        // 6. Create notifications
        await db.query(
            'INSERT INTO notifications ("userId", title, message, type, "isRead", "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
            [userIds[0], 'Welcome', 'TestGroup environment is ready for testing.', 'success', 0, now.toISOString()]
        );
        await db.query(
            'INSERT INTO notifications ("userId", title, message, type, "isRead", "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
            [userIds[1], 'Welcome', 'TestGroup environment is ready for testing.', 'success', 0, now.toISOString()]
        );

        console.log('--- Seeding Complete: TestGroup Loaded ---');
        console.log('Logins (Password: password123):');
        console.log('- testadmin@test.com (Admin)');
        console.log('- musaadmin@test.com (Admin)');
        console.log('- musatest@test.com (Member)');

    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await db.end();
    }
}

seed();