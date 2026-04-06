const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = __dirname;

async function runAll() {
  console.log("🚀 Starting all database migrations...\n");

  const files = fs.readdirSync(backendDir)
    .filter(file => file.startsWith('migrate-') && file.endsWith('.js'))
    .sort();

  for (const file of files) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📦 Running migration: ${file}`);
    try {
      // Execute each migration script as a separate process
      const output = execSync(`node ${file}`, { cwd: backendDir, encoding: 'utf-8' });
      console.log(output);
      console.log(`✅ ${file} completed.`);
    } catch (error) {
      console.error(`❌ ${file} failed:`);
      console.error(error.stdout || error.message);
    }
  }

  console.log(`\n--------------------------------------------------`);
  console.log("🎉 All migrations checked and executed!");
}

runAll();
