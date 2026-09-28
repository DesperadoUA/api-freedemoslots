const BaseCardBuilder = require('@/core/BaseCardBuilder')

class CardBuilder extends BaseCardBuilder {
    mainWithCounts(posts, countByTypeId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countByTypeId.get(post.id) ?? 0,
        }))
    }
}

module.exports = CardBuilder
