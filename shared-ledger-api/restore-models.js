const fs = require('fs');
const path = require('path');

const dirs = ['src/models', 'src/controllers'];

console.log('检查文件...');

dirs.forEach(dir => {
  const files = fs.readdirSync(path.join(__dirname, dir));
  
  files.forEach(file => {
    if (!file.endsWith('.js')) return;
    
    const fullPath = path.join(__dirname, dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    // 修复结尾错误的反引号
    if (/\.js`\);/.test(content)) {
      content = content.replace(/\.js`\);/g, ".js');");
      changed = true;
    }
    
    // 修复所有 datetime(`now`) -> datetime('now')
    if (content.includes('datetime(`now`)')) {
      content = content.replace(/datetime\(`now`\)/g, "datetime('now')");
      changed = true;
    }
    
    // 修复单个错误的结束引号
    if (content.includes("database.js`);")) {
      content = content.replace("database.js`);", "database.js');");
      changed = true;
    }
    
    // 修复其他明显问题
    content = content.replace(/\.toString\('hex`\)/g, ".toString('hex')");
    
    if (changed) {
      console.log('✅', fullPath);
      fs.writeFileSync(fullPath, content);
    }
  });
});

console.log('完成！');
