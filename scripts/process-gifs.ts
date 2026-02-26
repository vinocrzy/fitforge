// ═══════════════════════════════════════════════════════════════════
// FitForge — Build Script: Process Exercise GIFs
//
// 1. Copies GIFs from  ../../data/gifs/  →  public/data/gifs/
// 2. Extracts first frame of each GIF and converts to WebP preview
//    saved at  public/data/previews/<id>.webp
//
// Usage:  npx tsx scripts/process-gifs.ts
//         npm run process-gifs
// ═══════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ─── Paths ────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(ROOT, '..', 'data', 'gifs');
const GIF_DEST = path.join(ROOT, 'public', 'data', 'gifs');
const PREVIEW_DEST = path.join(ROOT, 'public', 'data', 'previews');

// ─── Config ───────────────────────────────────────────────────────

const PREVIEW_WIDTH = 240; // px — small thumbnail for lists
const WEBP_QUALITY = 75; // good balance between size and clarity

// ─── Helpers ──────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created ${path.relative(ROOT, dir)}`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏋️  FitForge — Process Exercise GIFs\n');

  // Validate source
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('   Expected GIF files at: ../../data/gifs/');
    process.exit(1);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith('.gif'))
    .sort();

  if (files.length === 0) {
    console.error('❌ No .gif files found in source directory');
    process.exit(1);
  }

  console.log(`  Found ${files.length} GIF files in ${path.relative(ROOT, SOURCE_DIR)}`);
  console.log(`  GIF destination:     public/data/gifs/`);
  console.log(`  Preview destination:  public/data/previews/`);
  console.log(`  Preview size:         ${PREVIEW_WIDTH}px wide, WebP q${WEBP_QUALITY}\n`);

  // Create output directories
  ensureDir(GIF_DEST);
  ensureDir(PREVIEW_DEST);

  let copied = 0;
  let previewed = 0;
  let skippedGif = 0;
  let skippedPreview = 0;
  let errors = 0;
  let totalGifBytes = 0;
  let totalPreviewBytes = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = path.basename(file, '.gif');
    const srcPath = path.join(SOURCE_DIR, file);
    const gifDest = path.join(GIF_DEST, file);
    const previewDest = path.join(PREVIEW_DEST, `${id}.webp`);

    const progress = `[${String(i + 1).padStart(3)}/${files.length}]`;

    try {
      // --- Copy GIF ---
      const srcStat = fs.statSync(srcPath);

      if (fs.existsSync(gifDest)) {
        const destStat = fs.statSync(gifDest);
        // Skip if same size (already copied)
        if (destStat.size === srcStat.size) {
          skippedGif++;
        } else {
          fs.copyFileSync(srcPath, gifDest);
          copied++;
          totalGifBytes += srcStat.size;
        }
      } else {
        fs.copyFileSync(srcPath, gifDest);
        copied++;
        totalGifBytes += srcStat.size;
      }

      // --- Generate WebP preview (first frame) ---
      if (fs.existsSync(previewDest)) {
        skippedPreview++;
      } else {
        // sharp extracts the first frame of animated GIFs by default
        // when not using { animated: true }
        await sharp(srcPath, { animated: false, pages: 1 })
          .resize(PREVIEW_WIDTH, PREVIEW_WIDTH, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: WEBP_QUALITY })
          .toFile(previewDest);

        const previewStat = fs.statSync(previewDest);
        totalPreviewBytes += previewStat.size;
        previewed++;
      }

      // Progress line
      if ((i + 1) % 20 === 0 || i === files.length - 1) {
        console.log(`  ${progress} ${file} ✓`);
      }
    } catch (err) {
      errors++;
      console.error(`  ${progress} ${file} ❌ ${(err as Error).message}`);
    }
  }

  // ─── Summary ──────────────────────────────────────────────────

  console.log('\n─── Summary ───────────────────────────────────────');
  console.log(`  GIFs copied:        ${copied} (${formatBytes(totalGifBytes)})`);
  console.log(`  GIFs skipped:       ${skippedGif} (already up-to-date)`);
  console.log(`  Previews created:   ${previewed} (${formatBytes(totalPreviewBytes)})`);
  console.log(`  Previews skipped:   ${skippedPreview} (already exist)`);
  if (errors > 0) {
    console.log(`  ❌ Errors:          ${errors}`);
  }
  console.log(`  Total files:        ${files.length}`);

  // Final directory stats
  const gifFiles = fs.readdirSync(GIF_DEST).filter((f) => f.endsWith('.gif'));
  const previewFiles = fs.readdirSync(PREVIEW_DEST).filter((f) => f.endsWith('.webp'));
  console.log(`\n  public/data/gifs/     → ${gifFiles.length} files`);
  console.log(`  public/data/previews/ → ${previewFiles.length} files`);
  console.log('\n✅ Done!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
