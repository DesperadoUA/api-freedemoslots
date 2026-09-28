const BaseHandler = require('@/handlers/BaseHandler')
const { createFeatureSlotTools } = require('@/handlers/feature/slotTools')

const LIMIT = 12

class AttachBestGamesHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const { slotModel, builder } = createFeatureSlotTools()
    const rows = await slotModel.getPublicBestPostsByFeatureId(post.id, langId, LIMIT)
    post.best_games = builder.main(rows)
  }
}

module.exports = AttachBestGamesHandler
