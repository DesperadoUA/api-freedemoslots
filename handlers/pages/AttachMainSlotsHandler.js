const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachMainSlotsHandler extends BaseHandler {
  async process(ctx) {
    const slotModel = new PostModel(slotSchema)
    const slotCardBuilder = new SlotCardBuilder()
    const slots = await slotModel.getPublicWithPublicVendor({
      limit: ctx.limit,
      lang: ctx.langId,
      orderBy: 'created_at',
      orderKey: 'DESC',
    })
    ctx.body.slots = slotCardBuilder.main(slots)
  }
}

module.exports = AttachMainSlotsHandler
