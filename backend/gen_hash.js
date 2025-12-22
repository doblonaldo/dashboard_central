const bcrypt = require('bcrypt');
async function run() {
    console.log('ADMIN_HASH=' + await bcrypt.hash('admin', 10));
    console.log('USER_HASH=' + await bcrypt.hash('123456', 10));
}
run();
