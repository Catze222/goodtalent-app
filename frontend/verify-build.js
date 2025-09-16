#!/usr/bin/env node
/**
 * Script simple para verificar que el build de Next.js funciona
 */

const { exec } = require('child_process');

console.log('🚀 Iniciando verificación de build...\n');

const buildProcess = exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error durante el build:');
    console.error(error.message);
    process.exit(1);
  }
  
  if (stderr && !stderr.includes('warning')) {
    console.error('❌ Errores encontrados:');
    console.error(stderr);
    process.exit(1);
  }
  
  console.log('✅ Build completado exitosamente!');
  console.log('\n📦 Resultado del build:');
  console.log(stdout);
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  // Solo mostrar errores, no warnings
  if (!data.includes('warning')) {
    process.stderr.write(data);
  }
});
