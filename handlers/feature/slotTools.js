const slotSchema = require('@/schemas/slot')
const PostModel = require('@/models/PostsKnex')
const SlotCardBuilder = require('@/app/w_slot/CardBuilder')

function createFeatureSlotTools() {
  return {
    slotModel: new PostModel(slotSchema),
    builder: new SlotCardBuilder(),
  }
}

module.exports = { createFeatureSlotTools }
