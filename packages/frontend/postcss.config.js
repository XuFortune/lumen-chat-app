// packages/frontend/postcss.config.js
export default {
    plugins: {
        '@tailwindcss/postcss': {}, // 👈 改成这个！
        autoprefixer: {},
    },
}
