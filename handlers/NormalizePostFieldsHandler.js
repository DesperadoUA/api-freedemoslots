const Helper = require('@/helpers')
const BaseHandler = require('@/handlers/BaseHandler')

class NormalizePostFieldsHandler extends BaseHandler {
  constructor(schema) {
    super()
    this.schema = schema
  }

  async process(ctx) {
    const { post } = ctx
    this.schema.metaFields.fields.forEach((item) => {
      const [key] = item.params
      if (item.json) {
        const isValidJson = Helper.isJsonString(post[key])
        post[key] = isValidJson ? JSON.parse(post[key]) : item.default
      }
    })
    post.content = Helper.textDecode(post.content)
  }
}

module.exports = NormalizePostFieldsHandler
