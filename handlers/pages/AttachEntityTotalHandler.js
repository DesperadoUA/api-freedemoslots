const PostModel = require('@/models/PostsKnex')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachEntityTotalHandler extends BaseHandler {
  constructor(schema) {
    super()
    this.schema = schema
  }

  async process(ctx) {
    const entityModel = new PostModel(this.schema)
    ctx.body.total = Number(await entityModel.getTotalCountPublicByLang(ctx.langId))
  }
}

module.exports = AttachEntityTotalHandler
