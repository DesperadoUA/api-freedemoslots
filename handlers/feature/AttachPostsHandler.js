const BaseHandler = require('@/handlers/BaseHandler')
const { createFeatureSlotTools } = require('@/handlers/feature/slotTools')

class AttachPostsHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId, limit, offset } = ctx
    const { slotModel, builder } = createFeatureSlotTools()
    const slots = await slotModel.getPublicPostsByFeatureId(post.id, {
      limit,
      offset,
      lang: langId,
      orderBy: 'created_at',
      orderKey: 'DESC',
    })
    post.posts = builder.main(slots)
  }
}

module.exports = AttachPostsHandler
