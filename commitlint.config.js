module.exports = {
    extends: [
        '@commitlint/config-angular',
        '@commitlint/config-lerna-scopes'
    ],
    rules: {
        'type-enum': [
            2,
            'always', [
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'revert',
                'style',
                'test',
                'chore'
            ]
        ]
    }
}
