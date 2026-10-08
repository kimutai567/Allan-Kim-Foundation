const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

function readHidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this command in an interactive terminal.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (error, result) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(result);
    };

    const onData = chunk => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') return finish(new Error('Cancelled.'));
        if (char === '\r' || char === '\n') return finish(null, value);
        if (char === '\u007f' || char === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
        } else if (char >= ' ' && char !== '\u007f') {
          value += char;
          stdout.write('*');
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const dbPath = process.env.DB_FILE || path.join(__dirname, 'foundation.db');
  const db = new DatabaseSync(dbPath);

  try {
    const admins = db.prepare('SELECT id, email FROM admins ORDER BY id').all();
    if (admins.length === 0) throw new Error(`No admin account exists in ${dbPath}.`);

    let admin = admins[0];
    if (admins.length > 1) {
      stdout.write('Admin accounts:\n');
      admins.forEach((account, index) => stdout.write(`${index + 1}. ${account.email}\n`));
      const rl = readline.createInterface({ input: stdin, output: stdout });
      const answer = await rl.question('Choose account number: ');
      rl.close();
      const index = Number(answer) - 1;
      if (!Number.isInteger(index) || !admins[index]) throw new Error('Invalid account number.');
      admin = admins[index];
    }

    stdout.write(`Resetting password for ${admin.email}\n`);
    const password = await readHidden('New password (minimum 8 characters): ');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const confirmation = await readHidden('Confirm new password: ');
    if (password !== confirmation) throw new Error('Passwords do not match.');

    db.prepare('UPDATE admins SET hash = ? WHERE id = ?')
      .run(bcrypt.hashSync(password, 10), admin.id);
    stdout.write('Admin password updated. Sign in with this email and your new password.\n');
  } finally {
    db.close();
  }
}

main().catch(error => {
  console.error(`Password reset failed: ${error.message}`);
  process.exitCode = 1;
});
