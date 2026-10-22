// 按 scripts/buildCopy.config.mjs 的映射，将指定包打包并复制其 dist 到目标目录。
// 跨平台（仅依赖 Node fs / child_process，不使用 rm/cp 等 Unix 命令）。
//
// 用法：
//   node scripts/buildCopy.mjs
// 或（已接入根 package.json）：
//   pnpm build:copy
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  cpSync,
  rmSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

async function loadConfig() {
  const cfgUrl = pathToFileURL(join(__dirname, 'buildCopy.config.mjs')).href
  const mod = await import(cfgUrl)
  return mod.default
}

// 枚举 packages/* 下所有包，记录目录名与 package.json 中的 name
function findPackages() {
  const pkgsDir = join(repoRoot, 'packages')
  return readdirSync(pkgsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      let name = d.name
      try {
        const json = JSON.parse(
          readFileSync(join(pkgsDir, d.name, 'package.json'), 'utf-8')
        )
        if (json.name) name = json.name
      } catch {
        // 忽略无法解析的目录
      }
      return { dirName: d.name, name, dir: join(pkgsDir, d.name) }
    })
}

function resolvePackage(key, packages) {
  // 支持三种写法：完整包名 / packages 下目录名 / 包名后缀（如 canvas-editor-plugin-docx）
  return packages.find(
    p =>
      p.name === key ||
      p.dirName === key ||
      p.name === `@hufe921/${key}` ||
      p.name.endsWith(`/${key}`)
  )
}

async function buildPackage(pkg) {
  console.log(`\n[build] ${pkg.name} (${pkg.dirName})`)
  await execAsync(`pnpm --filter "${pkg.name}" build`, {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}

function copyDist(pkg, dest, clean) {
  const src = join(pkg.dir, 'dist')
  if (!existsSync(src)) {
    throw new Error(`未找到构建产物: ${src}，请先构建该包`)
  }
  const absDest = resolve(repoRoot, dest)
  if (clean && existsSync(absDest)) {
    rmSync(absDest, { recursive: true, force: true })
  }
  mkdirSync(absDest, { recursive: true })
  cpSync(src, absDest, { recursive: true })
  console.log(`[ok] 复制 ${pkg.name} -> ${absDest}`)
}

async function main() {
  const config = await loadConfig()
  const options = config.options || {}
  const map = config.map || {}

  const packages = findPackages()
  const entries = Object.entries(map)
  if (entries.length === 0) {
    console.log('[warn] 映射为空，请在 scripts/buildCopy.config.mjs 的 map 中配置。')
    return
  }

  const tasks = []
  for (const [key, dest] of entries) {
    const pkg = resolvePackage(key, packages)
    if (!pkg) {
      console.error(`[error] 未找到包: ${key}`)
      process.exitCode = 1
      continue
    }
    tasks.push({ pkg, dest })
  }
  if (tasks.length === 0) return

  if (options.build !== false) {
    if (options.parallel) {
      await Promise.all(tasks.map(t => buildPackage(t.pkg)))
    } else {
      for (const t of tasks) {
        await buildPackage(t.pkg)
      }
    }
  }

  for (const t of tasks) {
    copyDist(t.pkg, t.dest, options.clean !== false)
  }

  console.log('\n[done] 全部完成')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
