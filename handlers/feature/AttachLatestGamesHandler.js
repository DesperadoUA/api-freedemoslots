const BaseHandler = require('@/handlers/BaseHandler')
const { createFeatureSlotTools } = require('@/handlers/feature/slotTools')

const LIMIT = 12

class AttachLatestGamesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const { slotModel, builder } = createFeatureSlotTools()
    const rows = await slotModel.getPublicLatestPostsByFeatureId(post.id, langId, LIMIT)
    post.latest_games = builder.main(rows)
  }
}

module.exports = AttachLatestGamesHandler
