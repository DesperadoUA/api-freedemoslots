const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachTypePostsHandler extends BaseHandler {
  async process(ctx) {
    const { post, langId, limit, offset } = ctx
    const slotModel = new PostModel(slotSchema)
    const slots = await slotModel.getPublicPostsByTypeId(post.id, {
      limit,
      offset,
      lang: langId,
      orderBy: 'created_at',
      orderKey: 'DESC',
    })
    post.posts = new SlotCardBuilder().main(slots)
  }
}

module.exports = AttachTypePostsHandler
