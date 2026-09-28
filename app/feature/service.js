const mainSchema = require('@/schemas/feature')
const BaseService = require('@/core/BaseService')
const { createPublicContext } = require('@/handlers/context')
const ValidateLangHandler = require('@/handlers/ValidateLangHandler')
const LoadPublicPostWithMetaHandler = require('@/handlers/LoadPublicPostWithMetaHandler')
const NormalizePostFieldsHandler = require('@/handlers/NormalizePostFieldsHandler')
const AttachSchemaRelativeHandler = require('@/handlers/relatives/AttachSchemaRelativeHandler')
const AttachPostsHandler = require('@/handlers/feature/AttachPostsHandler')
const AttachBestGamesHandler = require('@/handlers/feature/AttachBestGamesHandler')
const AttachLatestGamesHandler = require('@/handlers/feature/AttachLatestGamesHandler')
const AttachTotalHandler = require('@/handlers/feature/AttachTotalHandler')
const AttachTocHandler = require('@/handlers/AttachTocHandler')

class Service extends BaseService {
  constructor() {
    super(mainSchema)
  }

  async getPublicPostByUrl(url, lang, limit, offset) {
    const ctx = createPublicContext({ url, lang, limit, offset })

    const chain = new ValidateLangHandler()
    chain
      .setNext(new LoadPublicPostWithMetaHandler(this.schema))
      .setNext(new NormalizePostFieldsHandler(this.schema))
      .setNext(new AttachTocHandler())
      .setNext(new AttachSchemaRelativeHandler(this.schema, 'category'))
      .setNext(new AttachPostsHandler())
      .setNext(new AttachBestGamesHandler())
      .setNext(new AttachLatestGamesHandler())
      .setNext(new AttachTotalHandler())

    const result = await chain.handle(ctx)
    const post = result.stopped ? undefined : result.post
    return { post }
  }
}
module.exports = Service
