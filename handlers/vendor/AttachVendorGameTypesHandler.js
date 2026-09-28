const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachVendorGameTypesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const slotModel = new PostModel(slotSchema)
    post.game_types = await slotModel.getPublicGameTypesByVendorId(post.id, langId)
  }
}

module.exports = AttachVendorGameTypesHandler
