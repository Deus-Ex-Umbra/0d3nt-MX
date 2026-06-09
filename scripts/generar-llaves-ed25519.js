/* eslint-disable no-console */
const crypto = require('crypto');

function escapeForDotEnv(pem) {
  return String(pem || '')
    .trim()
    .replace(/\r?\n/g, '\\n');
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

console.log('=== PEM (copia/pega) ===');
console.log('\nLlave Privada (pkcs8):\n');
console.log(privateKey);
console.log('\nLlave Pública (spki):\n');
console.log(publicKey);

console.log('\n=== .env (con \\n escapado) ===');
console.log(`ED25519_PRIVATE_KEY="${escapeForDotEnv(privateKey)}"`);
console.log(`ED25519_PUBLIC_KEY="${escapeForDotEnv(publicKey)}"`);
console.log('');
console.log(`# Para 0d3ntApp (cliente Electron):`);
console.log(`VL_ED25519_PUBLIC_KEY_PEM="${escapeForDotEnv(publicKey)}"`);
