const pkg = require('./package.json');

module.exports = {
    /*
     ** Headers of the page
     */
    head: {
        title: 'women-in-state-politics',
        meta: [
            { charset: 'utf-8' },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            {
                hid: 'description',
                name: 'description',
                content: ''
            }
        ],
        link: [
            {
                rel: 'icon',
                type: 'image/x-icon',
                href: `/${pkg.name}/favicon.ico`
            },
            {
                rel: 'alternate',
                type: 'application/json+oembed',
                href: '//apps.publicintegrity.org/women-in-state-politics/oembed.json',
                title: 'women-in-state-politics'
            }
        ]
    },
    modules: [
        '@nuxtjs/axios',
        [
            '@nuxtjs/google-analytics',
            {
                id: 'UA-3383794-4',
                debug: {
                    sendHitTask: !(
                        typeof document !== 'undefined' &&
                        document &&
                        document.referrer &&
                        document.referrer.indexOf('publicintegrity.org') !== -1
                    )
                }
            }
        ]
    ],
    plugins: [
        { src: '~/plugins/tooltip.js', ssr: false },
        { src: '~/plugins/pym.js', ssr: false },
        { src: '~/plugins/typekit.js', ssr: false },
        { src: '~/plugins/chartbeat.js', ssr: false }
    ],
    axios: {
        baseURL: process.server
            ? `http://${process.env.HOST || 'localhost'}:${process.env.PORT ||
                  3000}`
            : `/${pkg.name}/`
    },
    router: {
        base: `/${pkg.name}/`
    },
    /*
     ** Global CSS
     */
    css: ['~/assets/css/site.css', '~/assets/css/main.css'],
    /*
     ** Add axios globally
     */
    build: {
        html: {
            minify: {
                collapseWhitespace: false,
                removeEmptyAttributes: false
            }
        },
        /*
         ** Run ESLINT on save
         */
        extend(config, ctx) {
            config.module.rules.push({
                test: /\.csv$/,
                use: [{ loader: 'raw-loader' }]
            });

            if (ctx.isClient && process.env.NODE_ENV !== 'production') {
                config.module.rules.push({
                    enforce: 'pre',
                    test: /\.(js|vue)$/,
                    loader: 'eslint-loader',
                    exclude: /(node_modules)/
                });
            }
        }
    }
};
