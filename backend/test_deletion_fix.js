const API_URL = 'http://localhost:3001/api';

async function testDelete() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        let res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@admin.com', password: 'admin' })
        });

        if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
        let data = await res.json();
        const adminToken = data.token;
        console.log('Admin logged in.');

        // 2. Generate Invite for Dummy User
        console.log('Generating invite for dummy user...');
        res = await fetch(`${API_URL}/invite/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ email: 'delete_me@test.com', role: 'VIEWER' })
        });

        if (res.status === 400) {
            console.log('User might already exist, trying to login...');
        } else if (!res.ok) throw new Error(`Invite generation failed: ${res.status}`);
        else {
            data = await res.json();
            const inviteToken = data.token;

            // 3. Accept Invite (Create User)
            console.log('Creating dummy user...');
            res = await fetch(`${API_URL}/invite/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteToken, name: 'Delete Me', password: 'password123' })
            });
            if (!res.ok) throw new Error(`Invite accept failed: ${res.status}`);
        }

        // 4. Login as Dummy User (To create Session & Logs)
        console.log('Logging in as dummy user to create sessions/logs...');
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'delete_me@test.com', password: 'password123' })
        });

        if (!res.ok) throw new Error(`Dummy login failed: ${res.status}`);
        data = await res.json();
        const userToken = data.token;

        // Get user ID from login response or /me
        res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Get me failed: ${res.status}`);
        data = await res.json();
        const userId = data.user.id || data.user.userId; // Check mapping
        if (!userId) {
            // If /me doesn't return ID, we might need to fetch user list as admin
            console.log('ID not found in /me, fetching user list...');
            res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const users = await res.json();
            const user = users.find(u => u.email === 'delete_me@test.com');
            if (!user) throw new Error('Dummy user not found in list');
            /*userId = user.id;*/ // Assignment to constant variable error prevention
        }

        // Re-fetch users list to be sure about ID if needed
        res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const users = await res.json();
        const targetUser = users.find(u => u.email === 'delete_me@test.com');
        if (!targetUser) throw new Error('Target user not found');

        console.log(`Dummy user ID: ${targetUser.id}`);

        // 5. Delete Dummy User as Admin
        console.log('Attempting to delete dummy user...');
        res = await fetch(`${API_URL}/users/${targetUser.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.status === 200) {
            console.log('SUCCESS: User deleted successfully (Foreign Key constraint handled).');
        } else {
            console.error('FAILED: User deletion returned status', res.status);
            console.log(await res.text());
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

testDelete();
