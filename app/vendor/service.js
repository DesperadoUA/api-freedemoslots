const mainSchema = require('@/schemas/vendor')
const BaseService = require('@/core/BaseService')
const { createPublicContext } = require('@/handlers/context')
const ValidateLangHandler = require('@/handlers/ValidateLangHandler')
const LoadPublicPostWithMetaHandler = require('@/handlers/LoadPublicPostWithMetaHandler')
const NormalizePostFieldsHandler = require('@/handlers/NormalizePostFieldsHandler')
const AttachSchemaRelativeHandler = require('@/handlers/relatives/AttachSchemaRelativeHandler')
const AttachVendorPostsHandler = require('@/handlers/vendor/AttachVendorPostsHandler')
const AttachVendorBestGamesHandler = require('@/handlers/vendor/AttachVendorBestGamesHandler')
const AttachVendorLatestGamesHandler = require('@/handlers/vendor/AttachVendorLatestGamesHandler')
const AttachVendorTotalHandler = require('@/handlers/vendor/AttachVendorTotalHandler')
const AttachVendorGameTypesHandler = require('@/handlers/vendor/AttachVendorGameTypesHandler')
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
      .setNext(new AttachVendorPostsHandler())
      .setNext(new AttachVendorBestGamesHandler())
      .setNext(new AttachVendorLatestGamesHandler())
      .setNext(new AttachVendorTotalHandler())
      .setNext(new AttachVendorGameTypesHandler())

    const result = await chain.handle(ctx)
    return result.stopped ? undefined : result.post
  }
}

module.exports = Service
