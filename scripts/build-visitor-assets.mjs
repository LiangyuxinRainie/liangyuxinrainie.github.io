import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Usage: node scripts/build-visitor-assets.mjs <extracted-patch-public-directory>
const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error('Provide the directory containing visitor-map.json and flags/.');
const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectDirectory, 'public');
const map = JSON.parse(await fs.readFile(path.join(sourceDirectory, 'visitor-map.json'), 'utf8'));
const files = (await fs.readdir(path.join(sourceDirectory, 'flags')))
  .filter((file) => /^[a-z]{2}\.png$/.test(file))
  .sort();
if (!files.length) throw new Error('No country flags found.');

const columns = 16;
const rows = Math.ceil(files.length / columns);
const positions = {};
const layers = await Promise.all(files.map(async (file, index) => {
  const x = index % columns;
  const y = Math.floor(index / columns);
  positions[file.slice(0, 2)] = [x * 20, y * 15];
  return {
    input: await sharp(path.join(sourceDirectory, 'flags', file))
      .resize(80, 60, { fit: 'contain', background: '#00000000' }).png().toBuffer(),
    left: x * 80,
    top: y * 60,
  };
}));

await sharp({
  create: { width: columns * 80, height: rows * 60, channels: 4, background: '#00000000' },
}).composite(layers).png().toFile(path.join(outputDirectory, 'visitor-flags.png'));
map.flags = { width: columns * 20, height: rows * 15, positions };
await fs.writeFile(path.join(outputDirectory, 'visitor-map.json'), JSON.stringify(map) + '\n');
console.log('Created the world map and one sprite containing ' + files.length + ' flags.');
