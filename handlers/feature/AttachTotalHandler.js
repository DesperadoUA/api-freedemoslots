const BaseHandler = require('@/handlers/BaseHandler')
const { createFeatureSlotTools } = require('@/handlers/feature/slotTools')

class AttachTotalHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId } = ctx
    const { slotModel } = createFeatureSlotTools()
    const counts = await slotModel.countPublicSlotsByFeatureIds([post.id], langId)
    post.total = counts.get(post.id) ?? 0
  }
}

module.exports = AttachTotalHandler
