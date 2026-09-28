const BaseHandler = require('@/handlers/BaseHandler')

class NormalizePageLangHandler extends BaseHandler {
  async process(ctx) {
    if (ctx.body?.lang === undefined) return
    ctx.body.lang = _LANG[ctx.body.lang] || ctx.body.lang
  }
}

module.exports = NormalizePageLangHandler
