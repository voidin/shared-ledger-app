const fs = require('fs');
const path = require('path');

console.log('正在修复 SQLite 兼容性问题...');

const modelsDir = path.join(__dirname, 'src/models');
const controllersDir = path.join(__dirname, 'src/controllers');

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // 修复：将 'datetime('now')' 替换为 `datetime('now')` 
  // 或者更好的方法：使用双引号字符串
  newContent = newContent.replace(/datetime\(`now`\)/g, "datetime('now')");
  
  // 处理单引号包裹的情况：'updated_at = datetime('now')'
  // 把整个字符串改成双引号包裹
  const regex1 = /'([^']*)datetime\('now'\)([^']*)'/g;
  newContent = newContent.replace(regex1, (match, before, after) => {
    return `"${before}datetime('now')${after}"`;
  });
  
  // 再直接替换字符串中的 datetime('now') 用 datetime(\'now\') 转义
  newContent = newContent.replace(/datetime\('now'\)/g, "datetime('now')");

  if (content !== newContent) {
    console.log(`✅ 已修复: ${filePath}`);
    fs.writeFileSync(filePath, newContent);
  }
}

// 处理 models 目录
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
modelFiles.forEach(file => fixFile(path.join(modelsDir, file)));

// 处理 controllers 目录
const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
controllerFiles.forEach(file => fixFile(path.join(controllersDir, file)));

console.log('🎉 修复完成！');
