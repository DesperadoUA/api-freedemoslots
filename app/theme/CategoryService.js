const schema = require('@/schemas/theme')
const BaseCategoryService = require('@/core/BaseCategoryService')
class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
