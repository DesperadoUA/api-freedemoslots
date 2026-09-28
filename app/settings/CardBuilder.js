const BaseCardBuilder = require('@/core/BaseCardBuilder')
class CardBuilder extends BaseCardBuilder {
    static mainCard(posts) {
        return posts.map(post => {
            return {
                "key": post.key_id,
                "value": this.parse(post.value)
            }
        })
    }
    static adminCard(posts) {
        return posts.map(post => {
            return {
                "key": post.key_id,
                "value": this.parse(post.value),
                "title": post.title,
                "id": post.id
            }
        })
    }
    static adminSingleCard(post) {
        return {...post, value: this.parse(post.value)}
    }
    static update(post) {
        return this.libValidateSave(post)
    }
}
module.exports = CardBuilder