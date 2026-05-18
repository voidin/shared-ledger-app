const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
}

function generateUpperCaseCode(length = 6) {
  const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += UPPER_CHARS.charAt(Math.floor(Math.random() * UPPER_CHARS.length));
  }
  return result;
}

function validateCode(code, length = 6) {
  if (typeof code !== 'string') return false;
  if (code.length !== length) return false;
  const regex = new RegExp(`^[${CHARACTERS}]{${length}}$`);
  return regex.test(code);
}

module.exports = {
  generateCode,
  generateUpperCaseCode,
  validateCode
};
