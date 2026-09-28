const mainSchema = require('@/schemas/volatility')
const BaseService = require('@/core/BaseService')
const { createPublicContext } = require('@/handlers/context')
const ValidateLangHandler = require('@/handlers/ValidateLangHandler')
const LoadPublicPostWithMetaHandler = require('@/handlers/LoadPublicPostWithMetaHandler')
const NormalizePostFieldsHandler = require('@/handlers/NormalizePostFieldsHandler')
const AttachSchemaRelativeHandler = require('@/handlers/relatives/AttachSchemaRelativeHandler')
const AttachVolatilityPostsHandler = require('@/handlers/volatility/AttachVolatilityPostsHandler')
const AttachVolatilityBestGamesHandler = require('@/handlers/volatility/AttachVolatilityBestGamesHandler')
const AttachVolatilityLatestGamesHandler = require('@/handlers/volatility/AttachVolatilityLatestGamesHandler')
const AttachVolatilityTotalHandler = require('@/handlers/volatility/AttachVolatilityTotalHandler')
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
      .setNext(new AttachVolatilityPostsHandler())
      .setNext(new AttachVolatilityBestGamesHandler())
      .setNext(new AttachVolatilityLatestGamesHandler())
      .setNext(new AttachVolatilityTotalHandler())

    const result = await chain.handle(ctx)
    return result.stopped ? undefined : result.post
  }
}

module.exports = Service
