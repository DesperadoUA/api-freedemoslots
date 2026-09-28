class BaseHandler {
  setNext(handler) {
    this.next = handler
    return handler
  }

  async handle(ctx) {
    if (ctx.stopped) return ctx
    await this.process(ctx)
    if (this.next) return this.next.handle(ctx)
    return ctx
  }

  async process(ctx) {
    return ctx
  }
}

module.exports = BaseHandler
