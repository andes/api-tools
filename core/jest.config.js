module.exports = {
    roots: ['./src'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        "^.+\\.jsx?$": "babel-jest",
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'node',
    moduleNameMapper: {
        // '@andes/api-tool': '<rootDir>/../api-tool/src'
    }
}