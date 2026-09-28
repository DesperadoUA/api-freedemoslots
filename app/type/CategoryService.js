const schema = require('@/schemas/type')
const BaseCategoryService = require('@/core/BaseCategoryService')
class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
