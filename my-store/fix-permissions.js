/**
 * Script to directly grant upload + user permissions via Strapi admin API
 * Run: node fix-permissions.js
 */
const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await request({
    hostname: 'localhost', port: 1337,
    path: '/admin/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'oussama21072000@gmail.com', password: 'Aazertyuiop123' });

  console.log('   Login status:', loginRes.status);
  const adminToken = loginRes.data?.data?.token;
  if (!adminToken) {
    console.error('   Login failed:', JSON.stringify(loginRes.data));
    return;
  }
  console.log('   Got admin token:', adminToken.substring(0, 20) + '...');

  // 2. Get Authenticated role ID  
  console.log('\n2. Getting roles...');
  const rolesRes = await request({
    hostname: 'localhost', port: 1337,
    path: '/admin/users-permissions/roles', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  });
  console.log('   Roles status:', rolesRes.status);
  
  if (rolesRes.status !== 200) {
    console.error('   Could not get roles. Response:', JSON.stringify(rolesRes.data).substring(0, 200));
    return;
  }
  
  const roles = rolesRes.data?.roles || rolesRes.data?.data || rolesRes.data || [];
  console.log('   Raw response keys:', Object.keys(rolesRes.data || {}));
  console.log('   Full response:', JSON.stringify(rolesRes.data).substring(0, 500));
  console.log('   Roles found:', Array.isArray(roles) ? roles.map(r => `${r.id}:${r.type}`).join(', ') : 'not array');
  
  const authRole = roles.find(r => r.type === 'authenticated');
  if (!authRole) {
    console.error('   Could not find authenticated role');
    return;
  }
  console.log('   Authenticated role ID:', authRole.id);

  // 3. Get current permissions for authenticated role
  console.log('\n3. Getting current permissions for authenticated role...');
  const permRes = await request({
    hostname: 'localhost', port: 1337,
    path: `/admin/users-permissions/roles/${authRole.id}`, method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  });
  console.log('   Permissions status:', permRes.status);
  
  if (permRes.status !== 200) {
    console.error('   Error:', JSON.stringify(permRes.data).substring(0, 200));
    return;
  }
  
  const permissions = permRes.data?.role?.permissions || {};
  
  // 4. Modify permissions - enable upload and user find/findOne/update
  console.log('\n4. Current upload permissions:', JSON.stringify(permissions['plugin::upload.upload'] || permissions['upload'] || 'not found'));
  console.log('   Current user permissions:', JSON.stringify(permissions['plugin::users-permissions.user'] || permissions['users-permissions']?.controllers?.user || 'not found'));
  
  // Enable upload.upload.upload
  if (permissions['plugin::upload.upload']) {
    if (permissions['plugin::upload.upload'].controllers?.upload) {
      permissions['plugin::upload.upload'].controllers.upload.upload = { enabled: true };
    }
  }
  if (permissions['upload']) {
    if (permissions['upload'].controllers?.upload) {
      permissions['upload'].controllers.upload.upload = { enabled: true };
    }
  }
  
  // Enable user find, findOne, update
  const userPermsKey = Object.keys(permissions).find(k => k.includes('users-permissions'));
  if (userPermsKey && permissions[userPermsKey].controllers?.user) {
    permissions[userPermsKey].controllers.user.find = { enabled: true };
    permissions[userPermsKey].controllers.user.findone = { enabled: true };
    permissions[userPermsKey].controllers.user.update = { enabled: true };
    permissions[userPermsKey].controllers.user.me = { enabled: true };
  }

  // 5. Update the role
  console.log('\n5. Updating role with new permissions...');
  const updateRes = await request({
    hostname: 'localhost', port: 1337,
    path: `/admin/users-permissions/roles/${authRole.id}`, method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  }, { permissions, users: [] });
  
  console.log('   Update status:', updateRes.status);
  console.log('   Response:', JSON.stringify(updateRes.data).substring(0, 200));
  
  if (updateRes.status === 200) {
    console.log('\n✅ Permissions updated successfully!');
  } else {
    console.log('\n❌ Update failed');
  }
}

main().catch(console.error);
