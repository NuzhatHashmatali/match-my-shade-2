const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');

async function main() {
  const filePath = path.join(process.cwd(), 'tmp.png');
  if (!fs.existsSync(filePath)) {
    const b = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAIAAeIh6xwAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(filePath, b);
  }
  const form = new FormData();
  form.append('image', fs.createReadStream(filePath), 'tmp.png');
  const response = await fetch('http://localhost:3000/match', { method: 'POST', body: form });
  console.log('status', response.status);
  console.log(await response.text());
}

const { FormData, File } = globalThis;
if (!globalThis.FormData) {
  const { FormData } = require('form-data');
  globalThis.FormData = FormData;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
