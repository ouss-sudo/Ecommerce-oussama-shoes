const axios = require('axios');

async function testFetch() {
  const qs = require('qs');
  // First login to get token
  const login = await axios.post('http://localhost:1337/api/auth/local', {
    identifier: 'oussama@gmail.com', // user ID 6
    password: 'password' // We don't know the password...
  }).catch(() => null);
  
  // Actually we can just override auth to see what happens as admin or public if we grant it.
}
testFetch();
