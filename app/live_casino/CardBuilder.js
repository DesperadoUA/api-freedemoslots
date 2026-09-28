const BaseCardBuilder = require('@/core/BaseCardBuilder')

class CardBuilder extends BaseCardBuilder {
    mainWithCounts(posts, countByLiveCasinoId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countByLiveCasinoId.get(post.id) ?? 0,
        }))
    }
}

module.exports = CardBuilder
