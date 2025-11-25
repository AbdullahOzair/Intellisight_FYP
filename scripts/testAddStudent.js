/*
 * Quick smoke test for creating a student via the API.
 * Run with: node scripts/testAddStudent.js
 */

const baseUrl = process.env.API_URL ?? 'http://localhost:3000/api';
const adminEmail = process.env.ADMIN_EMAIL ?? 'john.admin@intellisight.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';

const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function main() {
  try {
    let token;
    const loginRes = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    if (loginRes.ok) {
      const loginJson = await loginRes.json();
      token = loginJson?.data?.token;
    } else if (loginRes.status === 401) {
      console.log('Login failed (401). Attempting to register admin...');
      const registerRes = await fetch(`${baseUrl}/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CLI Tester',
          email: adminEmail,
          password: adminPassword,
          role: 'Tester',
        }),
      });

      if (!registerRes.ok) {
        const registerBody = await registerRes.text();
        throw new Error(`Register failed with status ${registerRes.status}: ${registerBody}`);
      }

      const registerJson = await registerRes.json();
      token = registerJson?.data?.token;
    } else {
      const loginBody = await loginRes.text();
      throw new Error(`Login failed with status ${loginRes.status}: ${loginBody}`);
    }

    if (!token) {
      throw new Error('Authentication succeeded but token missing in response');
    }

    console.log('Login OK, token length:', token.length);

    const payload = {
      Name: 'Test Student CLI',
      Email: `cli-${Date.now()}@example.com`,
      Zone_id: 1,
      Face_Pictures: [sampleImage],
    };

    const createRes = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      console.error('Create student failed:', createJson);
      throw new Error(`Student creation failed with status ${createRes.status}`);
    }

    console.log('Student created. ID:', createJson?.data?.Student_ID);
    console.log('Saved Face_Pictures type:', typeof createJson?.data?.Face_Pictures);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();
