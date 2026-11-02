const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of ['index.html', 'styles.css', 'app.js', 'Dockerfile', 'nginx.conf', 'docker-compose.yml']) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
}

const html = read('index.html');
const javascript = read('app.js');
const dockerfile = read('Dockerfile');

assert.match(html, /id="task-list"/);
assert.match(html, /id="task-form"/);
assert.match(javascript, /localStorage/);
assert.match(javascript, /function render/);
assert.match(javascript, /data-action="toggle"/);
assert.match(dockerfile, /FROM nginx/);
console.log('devops-webapp smoke test passed');
