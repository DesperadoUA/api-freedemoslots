const Helper = require('@/helpers')
const BaseHandler = require('@/handlers/BaseHandler')

class DecodePageContentHandler extends BaseHandler {
  async process(ctx) {
    if (!ctx.body || ctx.stopped) return
    ctx.body.content = Helper.textDecode(String(ctx.body.content || ''))
    const tocResult = Helper.applyToc(ctx.body.content)
    ctx.body.content = tocResult.content
    ctx.body.toc = tocResult.toc
  }
}

module.exports = DecodePageContentHandler
