import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Os worktrees das sessões paralelas ficam em .claude/worktrees: não são deste checkout.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
})
