const CategoryModel = require('@/models/CategoryKnex')
const PostModel = require('@/models/PostsKnex')
const RelativeModel = require('@/models/RelativeKnex')
const BaseHandler = require('@/handlers/BaseHandler')

/** Один relative из schema (category, slot_theme_relative, …) */
class AttachSchemaRelativeHandler extends BaseHandler {
  constructor(schema, relativeKey) {
    super()
    this.schema = schema
    this.relativeKey = relativeKey
    if (!schema.relatives?.[relativeKey]) {
      throw new Error(`Unknown schema relative: ${relativeKey}`)
    }
  }

  async process(ctx) {
    const { post } = ctx
    const relativeModel = new RelativeModel(this.schema)
    const ids = await relativeModel.getRelativeByPostId(post.id, this.relativeKey)
    if (!ids.length) {
      post[this.relativeKey] = []
      return
    }

    const { relativeSchema } = this.schema.relatives[this.relativeKey]
    const relativeSchemaModule = require(`@/schemas/${relativeSchema}`)
    const model =
      this.relativeKey === 'category'
        ? new CategoryModel(relativeSchemaModule)
        : new PostModel(relativeSchemaModule)

    post[this.relativeKey] = await model.getPublicPostsByArrId(ids)
  }
}

module.exports = AttachSchemaRelativeHandler
