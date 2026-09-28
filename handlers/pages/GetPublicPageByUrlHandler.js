const BaseHandler = require('@/handlers/BaseHandler')

class GetPublicPageByUrlHandler extends BaseHandler {
  constructor(model, url) {
    super()
    this.model = model
    this.url = url
  }

  async process(ctx) {
    const permalink = this.url || ctx.url
    const page = await this.model.getPublicPostByUrl(permalink, ctx.langId)
    if (!page) {
      ctx.errors.push('page not found')
      ctx.stopped = true
      return
    }
    ctx.body = page
  }
}

module.exports = GetPublicPageByUrlHandler
