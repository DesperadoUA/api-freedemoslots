const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const vendorSchema = require('@/schemas/vendor')
const VendorCardBuilder = require('@/app/vendor/CardBuilder')
const BaseHandler = require('@/handlers/BaseHandler')

class AttachMainVendorsHandler extends BaseHandler {
  async process(ctx) {
    const slotModel = new PostModel(slotSchema)
    const vendorModel = new PostModel(vendorSchema)
    const vendorCardBuilder = new VendorCardBuilder()
    const vendors = await vendorModel.getPublicPostsWithoutRelatives({
      limit: ctx.limit,
      lang: ctx.langId,
      orderBy: 'created_at',
      orderKey: 'DESC',
    })
    const vendorIds = vendors.map((v) => v.id)
    const slotCounts = await slotModel.countPublicSlotsByVendorIds(vendorIds, ctx.langId)
    ctx.body.vendors = vendorCardBuilder.mainWithCounts(vendors, slotCounts)
  }
}

module.exports = AttachMainVendorsHandler
