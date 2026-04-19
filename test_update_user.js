const http = require('http');

const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzc1ODYzNDQ4LCJleHAiOjE3Nzg0NTU0NDh9.z8kymyfMSUeGjgxeSRXLekFpvOLbWeP2f_KkmB5-Xcc';

const data = JSON.stringify({
  firstName: "UpdatedFirstName",
  lastName: "UpdatedLastName"
});

const req = http.request({
  hostname: 'localhost',
  port: 1337,
  path: '/api/users/5',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer ' + jwt
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Update Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
