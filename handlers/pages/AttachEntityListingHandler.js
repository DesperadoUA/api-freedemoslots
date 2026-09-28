const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachEntityListingHandler extends BaseHandler {
  constructor(schema, CardBuilder, resultKey, countMethod) {
    super()
    this.schema = schema
    this.CardBuilder = CardBuilder
    this.resultKey = resultKey
    this.countMethod = countMethod
  }

  async process(ctx) {
    const entityModel = new PostModel(this.schema)
    const slotModel = new PostModel(slotSchema)
    const entities = await entityModel.getPublicPostsWithoutRelatives({
      limit: ctx.limit,
      offset: ctx.offset,
      lang: ctx.langId,
      orderBy: 'created_at',
      orderKey: 'DESC',
    })
    const ids = entities.map((e) => e.id)
    const slotCounts = await slotModel[this.countMethod](ids, ctx.langId)
    const builder = new this.CardBuilder()
    ctx.body[this.resultKey] = builder.mainWithCounts(entities, slotCounts)
  }
}

module.exports = AttachEntityListingHandler
