const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachVolatilityTotalHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const slotModel = new PostModel(slotSchema)
    const counts = await slotModel.countPublicSlotsByVolatilityIds([post.id], langId)
    post.total = counts.get(post.id) ?? 0
  }
}

module.exports = AttachVolatilityTotalHandler
