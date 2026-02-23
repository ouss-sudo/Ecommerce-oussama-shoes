const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
    const row = db.prepare("SELECT * FROM strapi_core_store_settings WHERE key = 'plugin_users-permissions_email'").get();

    if (row) {
        console.log('--- CURRENT DATABASE VALUE ---');
        // console.log(row.value);

        // Parse the JSON
        let settings = JSON.parse(row.value);

        // Check for v5 key 'reset_password'
        if (settings.reset_password && settings.reset_password.options) {
            console.log('--- FOUND KEY: reset_password ---');
            console.log('Current message:', settings.reset_password.options.message);

            settings.reset_password.options.message = `<p>Vous avez fait une demande de réinitialisation de mot de passe.</p>
<p>Pour définir un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
<p><a href="http://localhost:4173/reset-password?code=<%= CODE %>" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
<p>Ou copiez ce lien dans votre navigateur :<br/>http://localhost:4173/reset-password?code=<%= CODE %></p>
<p>Merci.</p>`;
            settings.reset_password.options.object = 'Réinitialisation de mot de passe - Oussama Shoes';

            const newValue = JSON.stringify(settings);
            const update = db.prepare("UPDATE strapi_core_store_settings SET value = ? WHERE key = 'plugin_users-permissions_email'");
            const result = update.run(newValue);
            console.log(`--- UPDATED reset_password. Changes: ${result.changes} ---`);

        } else if (settings.email_reset_password && settings.email_reset_password.options) {
            console.log('--- FOUND KEY: email_reset_password ---');

            settings.email_reset_password.options.message = `<p>Vous avez fait une demande de réinitialisation de mot de passe.</p>
<p>Pour définir un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
<p><a href="http://localhost:4173/reset-password?code=<%= CODE %>" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
<p>Ou copiez ce lien dans votre navigateur :<br/>http://localhost:4173/reset-password?code=<%= CODE %></p>
<p>Merci.</p>`;
            settings.email_reset_password.options.object = 'Réinitialisation de mot de passe - Oussama Shoes';

            const newValue = JSON.stringify(settings);
            const update = db.prepare("UPDATE strapi_core_store_settings SET value = ? WHERE key = 'plugin_users-permissions_email'");
            const result = update.run(newValue);
            console.log(`--- UPDATED email_reset_password. Changes: ${result.changes} ---`);
        } else {
            console.log('--- ERROR: Could not find reset password settings key ---');
            console.log(JSON.stringify(settings, null, 2));
        }

    } else {
        console.log('No settings found for email');
    }
} catch (error) {
    console.error('Error:', error);
}

db.close();
