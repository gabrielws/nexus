import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'node_modules',
    '**/node_modules/**',
    'ios',
    '**/ios/**',
    'android',
    '**/android/**',
    '.expo',
    '**/.expo/**',
    '.vscode',
    '**/.vscode/**',
    'ignite/ignite.json',
    'ignite/ignite.json/**',
    'package.json',
    '**/package.json/**',
    '.eslintignore',
    '**/.eslintignore/**',
  ],
  react: true,
})
