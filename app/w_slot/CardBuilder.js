const BaseCardBuilder =  require('./../../core/BaseCardBuilder')
class CardBuilder  extends BaseCardBuilder {
    main(posts) {
        return posts.map(item => {
            const [vendor] = item.slot_vendor_relative
            return {
                title: item.title,
                permalink: item.permalink,
                thumbnail: item.thumbnail,
                best: Number(item.best) || 0,
                vendor: vendor ? {
                    title: vendor.title, permalink: vendor.permalink
                } : undefined
            }
        })
    }
    mainWithVendor(posts, vendor) {
        const vendorCard = vendor
            ? { title: vendor.title, permalink: vendor.permalink }
            : undefined
        return posts.map((item) => {
            const card = {
                title: item.title,
                permalink: item.permalink,
                thumbnail: item.thumbnail,
                best: Number(item.best) || 0,
                vendor: vendorCard,
            }
            if (item.release_date) card.release_date = item.release_date
            return card
        })
    }
}
module.exports = CardBuilder