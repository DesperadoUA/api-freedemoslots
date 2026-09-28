const BaseCategoryService = require('@/core/BaseCategoryService')
const schema = require('@/schemas/slot')
class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
