const PostModel = require('@/models/PostsKnex')
const BaseHandler = require('@/handlers/BaseHandler')

class LoadPublicPostWithMetaHandler extends BaseHandler {
  constructor(schema) {
    super()
    this.schema = schema
  }

  async process(ctx) {
    const postModel = new PostModel(this.schema)
    const post = await postModel.getPublicPostWithMetaByUrl(ctx.url, ctx.langId)
    if (!post) {
      ctx.stopped = true
      return
    }
    ctx.post = post
  }
}

module.exports = LoadPublicPostWithMetaHandler
