const BaseCardBuilder = require('@/core/BaseCardBuilder')
class CardBuilder  extends BaseCardBuilder {
    mainWithCounts(posts, countByThemeId) {
        return posts.map((post) => ({
            title: post.title,
            permalink: post.permalink,
            slotCounter: countByThemeId.get(post.id) ?? 0,
        }))
    }
}
module.exports = CardBuilder