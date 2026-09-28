const BaseHandler = require('@/handlers/BaseHandler')

class AttachVendorPermalinkHandler extends BaseHandler {
  async process(ctx) {
    const { post } = ctx
    const vendorRelative = post.slot_vendor_relative
    const [vendor] = vendorRelative?.current_value || []
    post.vendor_permalink = vendor?.permalink || null
  }
}

module.exports = AttachVendorPermalinkHandler
