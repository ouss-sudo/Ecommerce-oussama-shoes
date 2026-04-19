const http = require('http');

const data = JSON.stringify({
  username: 'testuser123',
  email: 'testuser123@gmail.com',
  password: 'Testpassword123'
});

const req = http.request({
  hostname: 'localhost',
  port: 1337,
  path: '/api/auth/local/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Register Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
