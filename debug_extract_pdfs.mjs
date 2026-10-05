import fs from 'fs';
import pdfParse from 'pdf-parse';

const names = ['pdf/lisandro.pdf', 'pdf/deibys.pdf', 'pdf/mpdf.pdf', 'pdf/sunnet.pdf'];

for (const name of names) {
  const buf = fs.readFileSync(name);
  const data = await pdfParse(buf);
  console.log(`\n===== FILE: ${name} =====`);
  console.log((data.text || '').slice(0, 3000));
  console.log('\n----- END SNIPPET -----\n');
}
