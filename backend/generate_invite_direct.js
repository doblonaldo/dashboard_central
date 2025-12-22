const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
    const email = 'novo_usuario@teste.com';
    const role = 'VIEWER';

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        console.log('User already exists:', email);
        return;
    }

    // Generate Token
    const token = crypto.randomUUID();

    const invite = await prisma.invite.create({
        data: {
            token,
            email,
            role,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdBy: 'DIRECT_SCRIPT'
        }
    });

    console.log('✅ INVITE GENERATED SUCCESSFULLY');
    console.log('---------------------------------------------------');
    console.log(`LINK: http://localhost:3000/invite?token=${token}`);
    console.log('---------------------------------------------------');
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
