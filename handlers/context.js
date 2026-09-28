function createPublicContext({ url, lang, limit, offset }) {
  return {
    errors: [],
    url,
    lang,
    langId: null,
    limit,
    offset,
    post: null,
    stopped: false,
  }
}

function createPagePublicContext({ url, lang, limit, offset }) {
  return {
    errors: [],
    body: {},
    url,
    lang,
    langId: null,
    limit,
    offset,
    stopped: false,
  }
}

module.exports = { createPublicContext, createPagePublicContext }
