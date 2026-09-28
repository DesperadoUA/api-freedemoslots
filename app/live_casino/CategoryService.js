const schema = require('@/schemas/live_casino')
const BaseCategoryService = require('@/core/BaseCategoryService')

class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
