const { spawnSync, execSync } = require('child_process');
const os = require('os');

let cwd = process.cwd();

// If on Windows and current directory path contains parentheses, resolve to 8.3 short path
// to prevent Vitest/picomatch treating parentheses as glob capture groups.
if (os.platform() === 'win32' && /[()]/.test(cwd)) {
  try {
    const shortPath = execSync(`cmd /c "for %I in ("${cwd}") do @echo %~sI"`, { encoding: 'utf-8' }).trim();
    if (shortPath && !/[()]/.test(shortPath)) {
      cwd = shortPath;
    }
  } catch (err) {
    // Ignore and fallback to normal cwd
  }
}

const isWatch = process.argv.includes('--watch');
const args = isWatch ? ['ng', 'test'] : ['ng', 'test', '--no-watch'];

const result = spawnSync('npx', args, {
  cwd,
  stdio: 'inherit',
  shell: true
});

process.exit(result.status ?? 0);
