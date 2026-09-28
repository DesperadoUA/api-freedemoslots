const PageModel = require('@/models/PageKnex')
const mainSchema = require('@/schemas/page')
const BaseService = require('@/core/BaseService')
const vendorSchema = require('@/schemas/vendor')
const themeSchema = require('@/schemas/theme')
const featureSchema = require('@/schemas/feature')
const volatilitySchema = require('@/schemas/volatility')
const typeSchema = require('@/schemas/type')
const seriesSchema = require('@/schemas/series')
const liveCasinoSchema = require('@/schemas/live_casino')
const VendorCardBuilder = require('@/app/vendor/CardBuilder')
const ThemeCardBuilder = require('@/app/theme/CardBuilder')
const FeatureCardBuilder = require('@/app/feature/CardBuilder')
const VolatilityCardBuilder = require('@/app/volatility/CardBuilder')
const TypeCardBuilder = require('@/app/type/CardBuilder')
const SeriesCardBuilder = require('@/app/series/CardBuilder')
const LiveCasinoCardBuilder = require('@/app/live_casino/CardBuilder')
const cash = require('@/helpers/cash')
const DateTime = require('@/helpers/dateTime')
const { createPagePublicContext } = require('@/handlers/context')
const ValidateLangHandler = require('@/handlers/ValidateLangHandler')
const GetPublicPageByUrlHandler = require('@/handlers/pages/GetPublicPageByUrlHandler')
const DecodePageContentHandler = require('@/handlers/pages/DecodePageContentHandler')
const NormalizePageLangHandler = require('@/handlers/pages/NormalizePageLangHandler')
const AttachMainSlotsHandler = require('@/handlers/pages/AttachMainSlotsHandler')
const AttachMainVendorsHandler = require('@/handlers/pages/AttachMainVendorsHandler')
const AttachEntityListingHandler = require('@/handlers/pages/AttachEntityListingHandler')
const AttachEntityTotalHandler = require('@/handlers/pages/AttachEntityTotalHandler')

class Service extends BaseService {
  constructor() {
    super(mainSchema)
  }

  _page(ctx) {
    return ctx.stopped ? null : ctx.body
  }

  async getPublicPostByUrl(url, lang) {
    const context = createPagePublicContext({ url, lang, limit: 0, offset: 0 })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, url))
      .setNext(new DecodePageContentHandler())
      .setNext(new NormalizePageLangHandler())

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async mainPage(lang) {
    const context = createPagePublicContext({ url: 'main', lang, limit: 8, offset: 0 })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'main'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachMainSlotsHandler())
      .setNext(new AttachMainVendorsHandler())

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async providersPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'providers', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'providers'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(vendorSchema, VendorCardBuilder, 'vendors', 'countPublicSlotsByVendorIds'))
      .setNext(new AttachEntityTotalHandler(vendorSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async slotThemesPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'slot-themes', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'slot-themes'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(themeSchema, ThemeCardBuilder, 'themes', 'countPublicSlotsByThemeIds'))
      .setNext(new AttachEntityTotalHandler(themeSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async slotFeaturesPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'slot-features', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'slot-features'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(featureSchema, FeatureCardBuilder, 'features', 'countPublicSlotsByFeatureIds'))
      .setNext(new AttachEntityTotalHandler(featureSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async volatilityPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'volatillity-rate', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'volatillity-rate'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(volatilitySchema, VolatilityCardBuilder, 'volatilities', 'countPublicSlotsByVolatilityIds'))
      .setNext(new AttachEntityTotalHandler(volatilitySchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async casinoGamesPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'casino-games', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'casino-games'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(typeSchema, TypeCardBuilder, 'types', 'countPublicSlotsByTypeIds'))
      .setNext(new AttachEntityTotalHandler(typeSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async casinoSeriesPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'casino-game-series', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'casino-game-series'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(seriesSchema, SeriesCardBuilder, 'series', 'countPublicSlotsBySeriesIds'))
      .setNext(new AttachEntityTotalHandler(seriesSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async liveCasinoGamesPage(lang, limit, offset) {
    const context = createPagePublicContext({ url: 'live-casino-games', lang, limit, offset })
    const model = new PageModel(this.schema)

    const chain = new ValidateLangHandler()
    chain
      .setNext(new GetPublicPageByUrlHandler(model, 'live-casino-games'))
      .setNext(new DecodePageContentHandler())
      .setNext(new AttachEntityListingHandler(liveCasinoSchema, LiveCasinoCardBuilder, 'live_casino', 'countPublicSlotsByLiveCasinoIds'))
      .setNext(new AttachEntityTotalHandler(liveCasinoSchema))

    const ctx = await chain.handle(context)
    return this._page(ctx)
  }

  async getPostById(id) {
    const model = new PageModel(this.schema)
    return await model.getPostById(id)
  }

  async indexAdmin(settings) {
    const model = new PageModel(this.schema)
    const response = { status: 'ok', body: [], total: 0, lang: _LANG[settings.lang] }
    response.body = await model.getPosts(settings)
    response.total = await model.getTotalCountByLang(settings.lang)
    return response
  }

  async update(data) {
    const pageModel = new PageModel(this.schema)
    const response = { status: 'ok', body: {} }
    const dataSave = this.dataValidate(data)
    await pageModel.updateById(data.id, dataSave)
    await cash.destroy()
    return response
  }

  dataValidate(data) {
    const newData = {}
    newData.title = data.title || ''
    newData.status = data.status || 'hide'
    if (data.created_at) newData.created_at = DateTime.toMysql(data.created_at)
    newData.updated_at = DateTime.toMysql(data.updated_at) || DateTime.currentDate()
    newData.content = data.content || ''
    newData.description = data.description || ''
    newData.h1 = data.h1 || ''
    newData.keywords = data.keywords || ''
    newData.meta_title = data.meta_title || ''
    newData.short_desc = data.short_desc || ''
    newData.thumbnail = data.thumbnail || _THUMBNAIL
    if (data.post_type) newData.post_type = data.post_type
    if (data.slug) newData.slug = data.slug
    return newData
  }
}

module.exports = Service
