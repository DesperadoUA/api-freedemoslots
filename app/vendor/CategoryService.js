const schema = require('@/schemas/vendor')
const BaseCategoryService = require('@/core/BaseCategoryService')
class Service extends BaseCategoryService {
  constructor() {
    super(schema);
  }
}
module.exports = Service;
