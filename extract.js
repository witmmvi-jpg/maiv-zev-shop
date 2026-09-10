const fs = require('fs');
const buffer = fs.readFileSync('public/fonts/THSarabunNew-v2.ttf');
const base64 = buffer.toString('base64');
fs.writeFileSync('src/components/admin/THSarabunNewBase64.ts', `export const THSarabunNewBase64 = "${base64}";\n`);
console.log("Done!");
