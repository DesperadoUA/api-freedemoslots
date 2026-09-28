const BaseHandler = require('@/handlers/BaseHandler')
const { createLiveCasinoSlotTools } = require('@/handlers/live_casino/slotTools')

class AttachPostsHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId, limit, offset } = ctx
    const { slotModel, builder } = createLiveCasinoSlotTools()
    const slots = await slotModel.getPublicPostsByLiveCasinoId(post.id, {
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
