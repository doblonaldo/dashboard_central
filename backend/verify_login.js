const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'admin';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error('❌ User NOT FOUND in database via Prisma.');
        return;
    }

    console.log('✅ User Found:', user.id, user.role);
    console.log('Stored Hash:', user.passwordHash);

    const match = await bcrypt.compare(password, user.passwordHash);

    if (match) {
        console.log('✅ Password MATCHES!');
    } else {
        console.error('❌ Password DOES NOT MATCH.');
        // Debug: Try hashing 'admin' again to see if it's different (salt variance is expected but verify logic is key)
        const newHash = await bcrypt.hash(password, 10);
        console.log('New Hash would be:', newHash);
    }
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
