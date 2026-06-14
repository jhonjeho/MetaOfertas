/**
 * Script para configurar CORS en Firebase Storage usando la API REST de Google Cloud.
 * Ejecutar con: node set-cors.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer el token de acceso desde el archivo de configuración de Firebase CLI
const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

// Bucket de Firebase Storage
const bucket = 'metaofertas.firebasestorage.app';

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

console.log(`\n🔧 Configurando CORS para: gs://${bucket}`);
console.log(`🔑 Usando token de acceso: ${accessToken.substring(0, 30)}...`);
console.log(`📋 Orígenes permitidos:`);
corsConfig[0].origin.forEach(o => console.log(`   - ${o}`));
console.log('');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ CORS configurado exitosamente!');
      console.log('📄 Respuesta del servidor:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log(data);
      }
      console.log('\n🎉 ¡Listo! Ahora puedes subir imágenes desde Netlify sin errores de CORS.');
    } else {
      console.error(`❌ Error HTTP ${res.statusCode}:`);
      console.error(data);
      if (res.statusCode === 401) {
        console.error('\n💡 El token de acceso expiró. Ejecuta "firebase login" de nuevo y vuelve a correr este script.');
      } else if (res.statusCode === 403) {
        console.error('\n💡 Sin permisos. Asegúrate de que tu cuenta tiene el rol "Storage Admin" en Google Cloud.');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de red:', error.message);
});

req.write(corsBody);
req.end();
