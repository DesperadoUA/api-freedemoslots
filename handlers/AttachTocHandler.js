const Helper = require('@/helpers')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachTocHandler extends BaseHandler {
  async process(ctx) {
    const target = ctx.post || ctx.body
    if (!target || ctx.stopped) return
    const { content, toc } = Helper.applyToc(target.content || '')
    target.content = content
    target.toc = toc
  }
}

module.exports = AttachTocHandler
