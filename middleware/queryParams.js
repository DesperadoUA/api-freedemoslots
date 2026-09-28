
function queryParams(req, res, next) {
    req.queryParams = {}
    if(req.query.limit) {
        const param = Number(req.query.limit)
        if(Number.isInteger(param)) req.queryParams.limit = param
    } 
    if(req.query.offset) {
        const param = Number(req.query.offset)
        if(Number.isInteger(param)) req.queryParams.offset = param
    }
    next()
}

module.exports = queryParams