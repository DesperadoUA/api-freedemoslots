const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachVendorBestGamesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const slotModel = new PostModel(slotSchema)
    const slots = await slotModel.getPublicBestPostsByVendorId(post.id, langId, 12)
    post.best_games = new SlotCardBuilder().mainWithVendor(slots, post)
  }
}

module.exports = AttachVendorBestGamesHandler
