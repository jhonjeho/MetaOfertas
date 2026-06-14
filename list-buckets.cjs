/**
 * Script para listar los buckets de Firebase Storage disponibles.
 * Ejecutar con: node list-buckets.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer el token de acceso
const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

// Listar todos los buckets del proyecto usando el número de proyecto
const projectNumber = '883554899291';
const projectId = 'metaofertas';

function listBuckets(projectRef) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'storage.googleapis.com',
      path: `/storage/v1/b?project=${projectRef}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`\n🔍 Buscando buckets con: ${projectRef}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.items && parsed.items.length > 0) {
            console.log('✅ Buckets encontrados:');
            parsed.items.forEach(b => {
              console.log(`   - ${b.name} (id: ${b.id})`);
            });
            resolve(parsed.items);
          } else if (parsed.error) {
            console.error('❌ Error:', parsed.error.message);
            resolve([]);
          } else {
            console.log('Respuesta:', JSON.stringify(parsed, null, 2));
            resolve([]);
          }
        } catch (e) {
          console.log('Respuesta raw:', data);
          resolve([]);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      resolve([]);
    });

    req.end();
  });
}

// También intentar acceder directamente al bucket con el nombre exacto del error de CORS
function checkBucketDirect(bucketName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'storage.googleapis.com',
      path: `/storage/v1/b/${encodeURIComponent(bucketName)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`\n🔍 Verificando bucket directo: ${bucketName}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Bucket encontrado!');
            console.log('   Nombre:', parsed.name);
            console.log('   ID:', parsed.id);
            console.log('   CORS actual:', JSON.stringify(parsed.cors || 'ninguno'));
            resolve(true);
          } else {
            console.error('❌ Error:', parsed.error ? parsed.error.message : data);
            resolve(false);
          }
        } catch (e) {
          console.log('Respuesta raw:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log(`\n🔑 Token: ${accessToken.substring(0, 30)}...`);
  
  // Intentar con diferentes referencias del proyecto
  await listBuckets(projectId);
  await listBuckets(projectNumber);
  
  // Verificar buckets directamente con nombres posibles
  const possibleBuckets = [
    'metaofertas.firebasestorage.app',
    'metaofertas.appspot.com',
    `${projectNumber}.firebasestorage.app`,
    'metaofertas-default-rtdb.firebaseio.com'
  ];
  
  for (const bucket of possibleBuckets) {
    await checkBucketDirect(bucket);
  }
}

main();
