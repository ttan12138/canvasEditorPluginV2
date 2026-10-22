import { rmSync, cpSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url))
const distFonts = join(root, '..', 'dist', 'fonts')
const publicFonts = join(root, '..', 'public', 'fonts')

if (existsSync(distFonts)) {
  rmSync(distFonts, { recursive: true, force: true })
}
if (existsSync(publicFonts)) {
  cpSync(publicFonts, distFonts, { recursive: true })
}
