const extensionColors: Record<string, string> = {
  // JavaScript / TypeScript
  js: 'text-yellow-400',
  jsx: 'text-yellow-400',
  ts: 'text-blue-400',
  tsx: 'text-blue-400',
  mjs: 'text-yellow-400',
  cjs: 'text-yellow-400',

  // Web
  html: 'text-orange-400',
  css: 'text-blue-300',
  scss: 'text-pink-400',
  less: 'text-blue-300',

  // Data / Config
  json: 'text-yellow-300',
  yaml: 'text-red-300',
  yml: 'text-red-300',
  toml: 'text-orange-300',
  xml: 'text-orange-400',
  env: 'text-yellow-600',

  // Markdown / Docs
  md: 'text-zinc-300',
  mdx: 'text-zinc-300',
  txt: 'text-zinc-400',

  // Images
  png: 'text-green-400',
  jpg: 'text-green-400',
  jpeg: 'text-green-400',
  gif: 'text-green-400',
  svg: 'text-orange-300',
  ico: 'text-green-400',
  webp: 'text-green-400',

  // Package / Lock
  lock: 'text-zinc-600',

  // Shell
  sh: 'text-green-300',
  bash: 'text-green-300',
  zsh: 'text-green-300',

  // Python
  py: 'text-blue-300',

  // Rust
  rs: 'text-orange-400',

  // Go
  go: 'text-cyan-400',

  // Docker
  dockerfile: 'text-blue-400',

  // Git
  gitignore: 'text-zinc-600'
}

const nameColors: Record<string, string> = {
  'package.json': 'text-green-400',
  'tsconfig.json': 'text-blue-400',
  'next.config.js': 'text-zinc-200',
  'next.config.mjs': 'text-zinc-200',
  'next.config.ts': 'text-zinc-200',
  'vite.config.ts': 'text-purple-400',
  'tailwind.config.js': 'text-cyan-400',
  'tailwind.config.ts': 'text-cyan-400',
  '.gitignore': 'text-zinc-600',
  '.env': 'text-yellow-600',
  '.env.local': 'text-yellow-600',
  'Dockerfile': 'text-blue-400',
  'docker-compose.yml': 'text-blue-400',
  'README.md': 'text-zinc-300'
}

export function getFileIconColor(filename: string): string {
  // Check exact name first
  const nameColor = nameColors[filename]
  if (nameColor) return nameColor

  // Check extension
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return extensionColors[ext] || 'text-zinc-600'
}
