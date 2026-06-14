/**
 * Script para configurar CORS en Firebase Storage usando la API REST de Google Cloud.
 * Ejecutar con: node set-cors.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer el token de acceso desde el archivo de configuración de Firebase CLI
const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

// Bucket de Firebase Storage — probar con el nombre alternativo
// Firebase Storage puede usar el formato: <projectId>.appspot.com
const buckets = [
  'metaofertas.firebasestorage.app',
  'metaofertas.appspot.com'
];

// Configuración CORS
const corsConfig = [
  {
    origin: [
      'https://met40fertas.netlify.app',
      'https://metaofertas.netlify.app',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:3000'
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable'
    ]
  }
];

const corsBody = JSON.stringify({ cors: corsConfig });

function tryBucket(bucket) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'storage.googleapis.com',
      path: `/storage/v1/b/${encodeURIComponent(bucket)}?fields=cors`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(corsBody)
      }
    };

    console.log(`\n🔧 Intentando con bucket: gs://${bucket}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ CORS configurado exitosamente en: gs://${bucket}`);
          try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(data);
          }
          console.log('\n🎉 ¡Listo! Ahora puedes subir imágenes desde Netlify sin errores de CORS.');
          resolve(true);
        } else {
          console.error(`❌ Error HTTP ${res.statusCode} para gs://${bucket}:`);
          try {
            const parsed = JSON.parse(data);
            console.error(parsed.error ? parsed.error.message : data);
          } catch (e) {
            console.error(data);
          }
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error de red para gs://${bucket}:`, error.message);
      resolve(false);
    });

    req.write(corsBody);
    req.end();
  });
}

async function main() {
  console.log(`\n🔑 Token: ${accessToken.substring(0, 30)}...`);
  console.log(`📋 Orígenes a autorizar:`);
  corsConfig[0].origin.forEach(o => console.log(`   - ${o}`));

  for (const bucket of buckets) {
    const success = await tryBucket(bucket);
    if (success) break;
  }
}

main();
