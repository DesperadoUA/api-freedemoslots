const knex = require("../db");
class OptionsModelKnex {
  #mainTable;
  constructor(schema) {
    this.schema = schema;
    this.#mainTable = schema.tableName;
  }
  async getPosts() {
    const data = await knex(this.#mainTable)
        .select()
    return data ? data : [];
  }
  async getPostById(id) {
    const data = await knex(this.#mainTable)
        .select()
        .where({ id })
        .first();
    return data ? data : undefined;
  }
}
module.exports = OptionsModelKnex;
