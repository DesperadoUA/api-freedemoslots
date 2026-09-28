const mainSchema = require('@/schemas/slot')
const vendorSchema = require('@/schemas/vendor')
const BaseService = require('@/core/BaseService')
const Helper = require('@/helpers')
const SlotModel = require('@/models/SlotsKnex')
const PostModel = require('@/models/PostsKnex')
const SlotCardBuilder = require('./CardBuilder')
const AttachVendorPermalinkHandler = require('@/handlers/slot/AttachVendorPermalinkHandler')

function mapRelativeTags(relatives = []) {
  return relatives.map(({ title, permalink }) => ({ title, permalink }))
}

class Service extends BaseService {
  constructor() {
    super(mainSchema);
  }
  async getPublicPostByUrl(url, vendor, lang, limit, offset) {
    if(!_LANG_ID[lang]) return
    const langId = _LANG_ID[lang]
    const slotPageModel = new SlotModel(this.schema)
    const slotModel = new PostModel(mainSchema)
    const post = await slotPageModel.getPublicPostByUrl(url, vendor, langId)
    if(post) {
      const [providerRel] = post.slot_vendor_relative
      const provider = {
        permalink: providerRel.permalink,
        title: providerRel.title,
      }
      post.provider = provider
      post.themes = mapRelativeTags(post.slot_theme_relative)
      post.features = mapRelativeTags(post.slot_feature_relative)
      const [volatilityRel] = post.slot_volatility_relative || []
      post.volatility = volatilityRel
        ? { title: volatilityRel.title, permalink: volatilityRel.permalink }
        : null
      const slotCardBuilder = new SlotCardBuilder()
      const [relatedSlots, slotCounts] = await Promise.all([
        slotModel.getPublicPostsByVendorId(providerRel.id, {
          limit,
          offset,
          lang: langId,
          orderBy: 'created_at',
          orderKey: 'DESC',
          exclude: [post.id],
        }),
        slotModel.countPublicSlotsByVendorIds([providerRel.id], langId),
      ])
      post.slots = slotCardBuilder.mainWithVendor(relatedSlots, provider)
      post.total = Math.max(0, (slotCounts.get(providerRel.id) ?? 0) - 1)
      delete post.slot_vendor_relative
      delete post.slot_theme_relative
      delete post.slot_feature_relative
      delete post.slot_type_relative
      delete post.slot_volatility_relative
      delete post.slot_series_relative
      delete post.slot_live_casino_relative
      post.content = Helper.textDecode(String(post.content || ''))
      const tocResult = Helper.applyToc(post.content)
      post.content = tocResult.content
      post.toc = tocResult.toc
    }
    return post
  }
  async getPostById(id) {
    const post = await super.getPostById(id)
    if (!post) return
    const ctx = { post, stopped: false }
    const chain = new AttachVendorPermalinkHandler()
    await chain.handle(ctx)
    return ctx.post
  }

  async indexAdmin(settings) {
    const response = await super.indexAdmin(settings)
    response.body = response.body.map(slot => {
      const [vendor] = slot.slot_vendor_relative || []
      slot.vendor_permalink = vendor ? vendor.permalink : null
      return slot
    })
    return response
  }

  async dataValidateInsert(data) {
    const newData = this.dataValidate(data)
    newData.lang = _LANG_ID[data.lang] ? _LANG_ID[data.lang] : _LANG_ID.ru
    newData.permalink = Helper.transliterateUrl(data.title)
    newData.status = 'hide'
    return newData
  }
  async dataValidateSave(data, schema) {
    const newData =  this.dataValidate(data)
    if(!data['slot_vendor_relative'].length) return {...newData, status: 'hide'}
    const regex = /\{(\d+)\}(?!.*\{)/;
    const vendorIds = data['slot_vendor_relative'].map(str => {
      const ids = str.match(regex);
      return ids.length ? ids.slice(-1)[0] : 0
    }).filter(item => item !== 0)
    const [vendorId] = vendorIds
    const vendorModel = new PostModel(vendorSchema)
    const vendor = await vendorModel.getPostById(vendorId)
    if(vendor.status === 'hide') return {...newData, status: 'hide'}
    const postModel = new PostModel(schema)
    newData.permalink = Helper.transliterateUrl(data.permalink)
    let counter = 0
    let newPermalink = newData.permalink
    do {
      const candidate = await postModel.getByVendorPermalink(
        vendor.id,
        newPermalink,
        data.id
      )
      if (candidate) {
        counter++
        newPermalink = `${newData.permalink}-${counter}`
      } else {
        newData.permalink = newPermalink
        break
      }
    } while (true)
    return newData

  }
}
module.exports = Service;
