/* eslint-disable no-undef */
// See https://github.com/eslint/eslint/issues/14137
// for why this cannot be an ECMA module.
module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	rules: {
		'sort-imports': [
			'warn',
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
		'lines-between-class-members': ['warn', 'always'],
	},
};
