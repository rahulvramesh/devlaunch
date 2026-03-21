export interface Template {
  id: string
  name: string
  description: string
  command: (projectName: string) => string
}

export const nextjsTemplate: Template = {
  id: 'nextjs',
  name: 'Next.js',
  description: 'Full-stack React framework',
  command: (projectName: string) =>
    `npx create-next-app@latest ${projectName} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
}

export const templates: Record<string, Template> = {
  nextjs: nextjsTemplate
}
