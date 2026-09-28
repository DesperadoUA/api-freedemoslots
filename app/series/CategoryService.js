const schema = require('@/schemas/series')
const BaseCategoryService = require('@/core/BaseCategoryService')

class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
