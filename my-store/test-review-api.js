/**
 * Teste si la permission CREATE review est bien active
 */
const http = require('http');

// D'abord, login avec un compte utilisateur pour obtenir son token JWT
async function request(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 1337,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(body && { 'Content-Length': Buffer.byteLength(body) }),
            },
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    console.log('🔐 Test de création de review via API...\n');

    // Essai sans token (doit échouer avec 401/403)
    const noAuthRes = await request('POST', '/api/reviews', {
        data: { rating: 5, comment: 'test', product: 'xxx' }
    });
    console.log(`POST /api/reviews (sans auth): ${noAuthRes.status}`);
    if (noAuthRes.status === 403) {
        console.log('✅ Correct: non-authentifié rejeté (403)');
    } else if (noAuthRes.status === 401) {
        console.log('✅ Correct: non-authentifié rejeté (401)');
    } else if (noAuthRes.status === 400) {
        console.log('⚠️  Requête arrivée mais données invalides (400) - permission OK!');
        console.log('   Message:', noAuthRes.data?.error?.message);
    } else {
        console.log('Réponse:', JSON.stringify(noAuthRes.data).substring(0, 200));
    }
}

main().catch(console.error);
