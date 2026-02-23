const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
    console.log('Opening database .tmp/data.db...');
    const row = db.prepare("SELECT * FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_email'").get();

    if (row) {
        console.log('Found settings! Parsing JSON...');
        const settings = JSON.parse(row.value);

        let template = null;
        if (settings.reset_password) {
            template = settings.reset_password.options.message;
            console.log('--- RESET PASSWORD TEMPLATE (Key: reset_password) ---');
        } else if (settings.email_reset_password) {
            template = settings.email_reset_password.options.message;
            console.log('--- RESET PASSWORD TEMPLATE (Key: email_reset_password) ---');
        }

        if (template) {
            console.log(template);
            console.log('---------------------------------------------------');
            if (template.includes('http://localhost:4173/reset-password')) {
                console.log('✅ VERIFICATION: The link points to localhost:4173 (Correct)');
            } else {
                console.log('❌ VERIFICATION: The link DOES NOT point to localhost:4173');
            }
        } else {
            console.log('❌ Could not find reset password template in JSON');
        }

    } else {
        console.log('❌ No settings found for plugin_users-permissions_email');
    }
} catch (error) {
    console.error('Error:', error);
}

db.close();
