/* eslint-env node */
module.exports = {
	env: {
		browser: true,
		es2021: true,
		webextensions: true,
	},
	extends: ['eslint:recommended', 'prettier', 'plugin:react/recommended'],
	plugins: ['html'],
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	rules: {
		'sort-imports': [
			'error',
			{
				ignoreCase: false,
				ignoreDeclarationSort: false,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				allowSeparatedGroups: false,
			},
		],
		'no-unused-vars': [
			'warn',
			{ vars: 'all', args: 'all', argsIgnorePattern: '^_' },
		],
		'prefer-const': 2,
		'lines-between-class-members': ['warn', 'always'],
		'react/prop-types': 'off',
	},
};
