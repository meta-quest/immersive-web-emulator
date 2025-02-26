module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier'],
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
			'error',
			{ vars: 'all', args: 'all', argsIgnorePattern: '^_' },
		],
		'lines-between-class-members': ['warn', 'always'],
		'prettier/prettier': 'error',
	},
	globals: {
		chrome: 'readonly',
	},
	root: true,
};
