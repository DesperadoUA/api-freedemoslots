const BaseHandler = require('@/handlers/BaseHandler')

class ValidateLangHandler extends BaseHandler {
  async process(ctx) {
    if (!_LANG_ID[ctx.lang]) {
      ctx.errors.push('invalid lang')
      ctx.stopped = true
    } else {
      ctx.langId = _LANG_ID[ctx.lang]
    }
  }
}

module.exports = ValidateLangHandler
