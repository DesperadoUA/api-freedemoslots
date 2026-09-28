const mainSchema = require('@/schemas/theme')
const BaseService = require('@/core/BaseService')
const { createPublicContext } = require('@/handlers/context')
const ValidateLangHandler = require('@/handlers/ValidateLangHandler')
const LoadPublicPostWithMetaHandler = require('@/handlers/LoadPublicPostWithMetaHandler')
const NormalizePostFieldsHandler = require('@/handlers/NormalizePostFieldsHandler')
const AttachSchemaRelativeHandler = require('@/handlers/relatives/AttachSchemaRelativeHandler')
const AttachThemePostsHandler = require('@/handlers/theme/AttachThemePostsHandler')
const AttachThemeBestGamesHandler = require('@/handlers/theme/AttachThemeBestGamesHandler')
const AttachThemeLatestGamesHandler = require('@/handlers/theme/AttachThemeLatestGamesHandler')
const AttachThemeTotalHandler = require('@/handlers/theme/AttachThemeTotalHandler')
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
      .setNext(new AttachThemePostsHandler())
      .setNext(new AttachThemeBestGamesHandler())
      .setNext(new AttachThemeLatestGamesHandler())
      .setNext(new AttachThemeTotalHandler())

    const result = await chain.handle(ctx)
    return result.stopped ? undefined : result.post
  }
}

module.exports = Service
