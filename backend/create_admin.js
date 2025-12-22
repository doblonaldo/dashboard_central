const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                name: 'Administrator',
                passwordHash: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log('Admin user ready:', user.email);
    } catch (e) {
        console.error('Error creating admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
