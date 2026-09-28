const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
module.exports = {
    development: {
        client: 'mysql',
        connection: {
            host: process.env.HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.PASSWORD || '',
            database: process.env.DB || 'seo-slots',
            migrations: {
                directory: __dirname + '/migrations'
            },
            seeds: {
                directory: __dirname + '/seeds'
            }
        }
    },
    staging: {},
    production: {}
}