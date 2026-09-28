const knex = require('../db')

const cash = {
    getCacheKey(req) {
        return `toc1:${req.originalUrl || req.url}`
    },

    async getData(key) {
        const row = await knex('api_cache').where({ cache_key: key }).first()
        if (!row?.body) return null
        try {
            return JSON.parse(row.body)
        } catch {
            return null
        }
    },

    async setData(key, data) {
        const body = JSON.stringify(data)
        const exists = await knex('api_cache').where({ cache_key: key }).first()
        if (exists) {
            await knex('api_cache')
                .where({ cache_key: key })
                .update({ body, updated_at: knex.fn.now() })
            return
        }
        await knex('api_cache').insert({ cache_key: key, body })
    },

    async destroy() {
        await knex('api_cache').del()
    },

    /** Успешный публичный ответ: пишем в кеш и отдаём клиенту */
    async send(req, res, body) {
        if (!body) {
            return res.status(404).json({ status: 'error' })
        }
        const payload = { status: 'ok', body }
        await cash.setData(req.cacheKey || cash.getCacheKey(req), payload)
        return res.status(200).json(payload)
    },
}

module.exports = cash
