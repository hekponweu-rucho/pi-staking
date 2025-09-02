module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Revert previous commit
        'security', // Security fixes
        'config',   // Configuration changes
        'deps',     // Dependency updates
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [
        // Applications
        'backend',
        'frontend',
        'microservice',
        
        // Packages
        'shared-types',
        'ui-components', 
        'monitoring',
        
        // Features
        'auth',
        'claims',
        'investments',
        'users',
        'levels',
        'streaks',
        'referrals',
        'withdrawals',
        'admin',
        'api',
        'websocket',
        'queue',
        
        // Infrastructure
        'docker',
        'database',
        'redis',
        'monitoring',
        'ci',
        'deploy',
        'security',
        
        // Tools & Config
        'lint',
        'test',
        'build',
        'deps',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 120],
    'footer-leading-blank': [1, 'always'],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};