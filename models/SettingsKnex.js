const knex = require("../db");
class SettingsModelKnex {
  #mainTable;
  #defaultLang;
  constructor(schema) {
    this.schema = schema;
    this.#mainTable = schema.tableName;
    this.#defaultLang = 1;
  }
  async getPosts(lang = this.#defaultLang) {
    const data = await knex(this.#mainTable)
        .where({ lang })
        .select()
    return data ? data : [];
  }
  async indexAdmin(lang = this.#defaultLang) {
    const data = await knex(this.#mainTable)
        .where({ lang })
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
  async update(data, id) {
    return await knex(this.#mainTable).where({ id: id }).update(data);
  }
}
module.exports = SettingsModelKnex;
