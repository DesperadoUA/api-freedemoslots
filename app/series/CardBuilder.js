const BaseCardBuilder = require('@/core/BaseCardBuilder')

class CardBuilder extends BaseCardBuilder {
    mainWithCounts(posts, countBySeriesId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countBySeriesId.get(post.id) ?? 0,
        }))
    }
}

module.exports = CardBuilder
