const BaseCardBuilder = require('@/core/BaseCardBuilder')
class CardBuilder  extends BaseCardBuilder {
    mainWithCounts(posts, countByFeatureId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countByFeatureId.get(post.id) ?? 0,
        }))
    }
}
module.exports = CardBuilder
