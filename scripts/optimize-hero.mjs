import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";

const widths = [640, 1280, 1920, 2560];
const srcDir = "public/images/hero";
const outDir = "public/images/hero/optimized";

await mkdir(outDir, { recursive: true });

const files = await readdir(srcDir);
for (const f of files) {
  if (!/\.(jpe?g|png)$/i.test(f)) continue;
  const base = f.replace(/\.[^.]+$/, "");
  for (const w of widths) {
    const out = join(outDir, `${base}-${w}.webp`);
    await sharp(join(srcDir, f))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(out);
    console.log("→", out);
  }
}
