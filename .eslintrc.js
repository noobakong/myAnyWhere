module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2015
    },
    "globals": {
        "process": true
    },
    "rules": {
        "no-console": ["error", { allow: ["warn", "error", "info"] }],
        "indent": [
            "error",
            2
        ],
        "no-unused-vars": "off",
        "linebreak-style": [
            0,
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ]
    },
    "parserOptions": {
        "ecmaVersion": 8
    }
};
