const cash = require('../helpers/cash')

async function cashData(req, res, next) {
    try {
        req.cacheKey = cash.getCacheKey(req)
        const cached = await cash.getData(req.cacheKey)
        if (cached) {
            return res.status(200).json(cached)
        }
        next()
    } catch (err) {
        next(err)
    }
}

async function cashDestroy(req, res, next) {
    try {
        await cash.destroy()
        next()
    } catch (err) {
        next(err)
    }
}

module.exports = {
    cashData,
    cashDestroy,
}
