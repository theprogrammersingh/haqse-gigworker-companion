import { spawn, type ChildProcess } from 'node:child_process'
import { appendFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * A private copy of the e2e build served on its own port, so a test can
 * "deploy" a new version (edit sw.js on disk) without affecting other tests.
 */
export interface DeployServer {
  url: string
  deployNewVersion: () => void
  stop: () => void
}

/** Asks the OS for a free port, so parallel tests never collide. */
const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const srv = createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      srv.close(() =>
        typeof addr === 'object' && addr ? resolve(addr.port) : reject(new Error('no port')),
      )
    })
  })

export async function startDeployServer(): Promise<DeployServer> {
  const port = await freePort()
  const root = join(import.meta.dirname, '../..')
  const dir = mkdtempSync(join(tmpdir(), 'haqse-deploy-'))
  cpSync(join(root, 'dist-e2e'), dir, { recursive: true })
  const proc: ChildProcess = spawn(
    'npx',
    [
      'vite',
      'preview',
      '--outDir',
      dir,
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd: root, stdio: 'ignore', env: { ...process.env, VITE_BASE: '/' } },
  )
  const url = `http://127.0.0.1:${port}`
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break
    } catch {
      await new Promise((r) => setTimeout(r, 150))
    }
  }
  return {
    url,
    deployNewVersion: () => appendFileSync(join(dir, 'sw.js'), `\n// deploy ${Date.now()}\n`),
    stop: () => {
      proc.kill()
      rmSync(dir, { recursive: true, force: true })
    },
  }
}
