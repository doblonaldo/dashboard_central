const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // 1. Create Admin
    const adminEmail = 'admin@example.com';
    const adminPass = await bcrypt.hash('admin', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash: adminPass }, // Reset password just in case
        create: {
            email: adminEmail,
            name: 'Administrator',
            passwordHash: adminPass,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin User Ready: admin@example.com / admin');

    // 2. Create Standard User
    const userEmail = 'usuario@empresa.com';
    const userPass = await bcrypt.hash('123456', 10);

    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: { passwordHash: userPass },
        create: {
            email: userEmail,
            name: 'Usuário Padrão',
            passwordHash: userPass,
            role: 'VIEWER',
        },
    });
    console.log('✅ Standard User Ready: usuario@empresa.com / 123456');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
