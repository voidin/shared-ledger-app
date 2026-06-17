const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/models'),
  path.join(__dirname, 'src/controllers')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 1. 修复 datetime(`now`) -> datetime('now')
  if (content.includes('datetime(`now`)')) {
    content = content.replace(/datetime\(`now`\)/g, "datetime('now')");
    changed = true;
  }
  
  // 2. 如果有单引号内的 datetime('now')，就把整个字符串改成模板字符串
  const matches = content.match(/'[^']*datetime\('now'\)[^']*'/g);
  if (matches) {
    matches.forEach(match => {
      const replacement = match.replace(/^'/, '`').replace(/'$/, '`');
      if (replacement !== match) {
        content = content.replace(match, replacement);
        changed = true;
      }
    });
  }
  
  if (changed) {
    console.log('✅', filePath);
    fs.writeFileSync(filePath, content);
  }
}

dirs.forEach(dir => {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.js')) {
      processFile(path.join(dir, file));
    }
  });
});

console.log('Done!');
