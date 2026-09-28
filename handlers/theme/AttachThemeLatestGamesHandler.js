const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachThemeLatestGamesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const slotModel = new PostModel(slotSchema)
    const slots = await slotModel.getPublicLatestPostsByThemeId(post.id, langId, 12)
    post.latest_games = new SlotCardBuilder().main(slots)
  }
}

module.exports = AttachThemeLatestGamesHandler
