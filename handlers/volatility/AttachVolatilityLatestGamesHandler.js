const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachVolatilityLatestGamesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const slotModel = new PostModel(slotSchema)
    const slots = await slotModel.getPublicLatestPostsByVolatilityId(post.id, langId, 12)
    post.latest_games = new SlotCardBuilder().main(slots)
  }
}

module.exports = AttachVolatilityLatestGamesHandler
