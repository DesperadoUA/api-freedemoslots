const BaseCardBuilder = require('@/core/BaseCardBuilder')
class CardBuilder  extends BaseCardBuilder {
    mainWithCounts(posts, countByVolatilityId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countByVolatilityId.get(post.id) ?? 0,
        }))
    }
}
module.exports = CardBuilder
