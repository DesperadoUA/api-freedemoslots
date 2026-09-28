const BaseHandler = require('@/handlers/BaseHandler')
const { createLiveCasinoSlotTools } = require('@/handlers/live_casino/slotTools')

class AttachTotalHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const { slotModel } = createLiveCasinoSlotTools()
    const counts = await slotModel.countPublicSlotsByLiveCasinoIds([post.id], langId)
    post.total = counts.get(post.id) ?? 0
  }
}

module.exports = AttachTotalHandler
