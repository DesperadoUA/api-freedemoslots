const BaseCardBuilder = require('@/core/BaseCardBuilder')
const PostModel = require('@/models/PostsKnex')
const slotSchema = require('@/schemas/slot')
const RelativeModel = require('@/models/RelativeKnex')
class CardBuilder  extends BaseCardBuilder {
    async main(posts) {
        const relativeModel = new RelativeModel(slotSchema)
        const slotModel = new PostModel(slotSchema)
        const newData = []
        for(const post of posts) {
            const slotIds = await relativeModel.getPostIdByRelative(post.id, 'slot_vendor_relative')
            const publicSlots = await slotModel.getPublicPostsByArrId(slotIds)
            newData.push({
                title: post.title,
                permalink: post.permalink,
                thumbnail: post.thumbnail,
                slotCounter: publicSlots.length
            })
        }
        return newData
    }
    mainWithCounts(posts, countByVendorId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            thumbnail: post.thumbnail,
            slotCounter: countByVendorId.get(post.id) ?? 0,
        }))
    }
}
module.exports = CardBuilder