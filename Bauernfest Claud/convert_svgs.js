const sharp = require('sharp');
const path = require('path');

const BASE = 'site-bauernfest/FAQ';
const slugs = [
  'quando-e-a-bauernfest-petropolis',
  'o-que-e-a-bauernfest',
  'quantos-dias-dura-a-bauernfest',
  'quem-a-bauernfest-homenageia',
  'o-que-fazer-na-bauernfest',
  'significado-de-bauernfest',
  'como-funciona-a-bauernfest',
  'bauernfest-2026',
  'datas-da-bauernfest',
  'horario-bauernfest-petropolis',
];

async function convert() {
  for (const slug of slugs) {
    const svgPath = path.join(BASE, slug, `${slug}.svg`);
    const jpgPath = path.join(BASE, slug, `${slug}.jpg`);
    try {
      await sharp(svgPath)
        .resize(1200, 480)
        .jpeg({ quality: 92 })
        .toFile(jpgPath);
      const fs = require('fs');
      const size = Math.round(fs.statSync(jpgPath).size / 1024);
      console.log(`OK ${slug} (${size}KB)`);
    } catch (e) {
      console.log(`ERRO ${slug}: ${e.message}`);
    }
  }
}

convert();
