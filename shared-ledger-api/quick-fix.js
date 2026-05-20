const fs = require('fs');
const path = require('path');

const modelFiles = [
  'src/models/category.js',
  'src/models/export.js',
  'src/models/ledger.js',
  'src/models/ledgerMember.js',
  'src/models/ledgerPermission.js',
  'src/models/transaction.js',
  'src/models/transactionImage.js',
  'src/models/user.js',
  'src/models/virtualMember.js'
];

modelFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log('跳过不存在:', filePath);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // 修复所有错误的结束引号：'...` -> '...'
  const regex = /'[^']+`;/g;
  content = content.replace(regex, (match) => {
    const fixed = match.replace(/`;$/, "';");
    if (fixed !== match) {
      changed = true;
    }
    return fixed;
  });
  
  // 修复其他错误
  content = content.replace(/datetime\(`now`\)/g, "datetime('now')");
  
  // 确保 require 语句正确
  content = content.replace(/require\(['"][^'"]+\.js['"]\);/g, (match) => {
    if (match.endsWith('`);')) {
      changed = true;
      return match.replace('`);', "');");
    }
    return match;
  });
  
  if (changed) {
    console.log('✅ 修复:', filePath);
    fs.writeFileSync(fullPath, content);
  }
});

console.log('快速修复完成！');
