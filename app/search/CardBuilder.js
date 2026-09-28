class CardBuilder  {
    static adminCards(posts) {
        return posts.map(post => {
            return {title: post.title, permalink: `/admin/${post.slug}/${post.id}`}
        })
    }
}
module.exports = CardBuilder