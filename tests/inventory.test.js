// inventory.test.js - pruebas básicas para el sistema de inventario (ESM)
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function contains(text, substring) {
  return text.indexOf(substring) !== -1;
}

try {
  const adminHtml = fs.readFileSync(join(__dirname, '..', 'admin.html'), 'utf8');
  const adminJs = fs.readFileSync(join(__dirname, '..', 'admin.js'), 'utf8');

  console.log('Verificando campos en admin.html...');
  if (!contains(adminHtml, 'id="productStock"')) throw new Error('Falta campo productStock en admin.html');
  if (!contains(adminHtml, 'id="editProductStock"')) throw new Error('Falta campo editProductStock en admin.html');
  console.log('Campos encontrados ✔');

  console.log('Verificando función changeProductStock en admin.js...');
  if (!contains(adminJs, 'function changeProductStock') && !contains(adminJs, 'async function changeProductStock')) {
    throw new Error('Falta la función changeProductStock en admin.js');
  }
  console.log('Función encontrada ✔');

  console.log('\n✅ Tests de inventario pasaron correctamente');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Test de inventario fallo:', err.message);
  process.exit(1);
}
