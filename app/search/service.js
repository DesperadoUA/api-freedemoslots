const SlotSchema = require('@/schemas/slot')
const VendorSchema = require('@/schemas/vendor')
const ThemeSchema = require('@/schemas/theme')
const FeatureSchema = require('@/schemas/feature')
const VolatilitySchema = require('@/schemas/volatility')
const TypeSchema = require('@/schemas/type')
const SeriesSchema = require('@/schemas/series')
const LiveCasinoSchema = require('@/schemas/live_casino')
const PostModel = require('@/models/PostsKnex')
const CategoryModel = require('@/models/CategoryKnex')
const CardBuilder = require('./CardBuilder')
class SearchService {
    static async adminSearch(lang, searchWord, db) {
        let postType = ''
        const configPosts = {
            slots: SlotSchema,
            vendors: VendorSchema,
            themes: ThemeSchema,
            features: FeatureSchema,
            volatilities: VolatilitySchema,
            types: TypeSchema,
            series: SeriesSchema,
            live_casino: LiveCasinoSchema
        }
        const configCategory = {
            slot_category: SlotSchema,
            vendor_category: VendorSchema,
            theme_category: ThemeSchema,
            feature_category: FeatureSchema,
            volatility_category: VolatilitySchema,
            type_category: TypeSchema,
            series_category: SeriesSchema,
            live_casino_category: LiveCasinoSchema
        }
        if(db in configPosts) postType = 'post'
        else if(db in configCategory) postType = 'category'
        else return [];
        const model = postType === 'post' ? new PostModel(configPosts[db]) : new CategoryModel(configCategory[db])
        const result = await model.searchByTitle(lang, searchWord)
        return CardBuilder.adminCards(result);
    }
}
module.exports = SearchService;
