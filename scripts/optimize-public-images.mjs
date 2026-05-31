import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

const widths = [384, 640, 960, 1280, 1600];
const srcRoot = "public/images";
const outRoot = "public/images/optimized";
const targetDirs = [
  "common",
  "economy",
  "guides/shared-kitchen",
  "private-shower",
  "private-toilet-and-shower",
];

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(path)));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

for (const targetDir of targetDirs) {
  const srcDir = join(srcRoot, targetDir);
  const files = await collectImages(srcDir);

  for (const file of files) {
    const rel = relative(srcRoot, file);
    const ext = extname(rel);
    const base = rel.slice(0, -ext.length);
    const outDir = dirname(join(outRoot, base));

    await mkdir(outDir, { recursive: true });

    for (const width of widths) {
      const out = join(outRoot, `${base}-${width}.webp`);

      await sharp(file)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(out);

      console.log("->", out);
    }
  }
}
