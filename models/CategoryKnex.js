const knex = require("../db");
const RelativeModel = require("./RelativeKnex");
const PostModel = require("./PostsKnex");
class CategoryModelKnex {
  #mainTable;
  #defaultLimit;
  #defaultOffset;
  #orderBy;
  #orderKey;
  #defaultLang;
  constructor(schema) {
    this.schema = schema;
    this.#mainTable = schema.category.tableName;
    this.#defaultLimit = 8;
    this.#defaultOffset = 0;
    this.#orderBy = "created_at";
    this.#orderKey = "DESC";
    this.#defaultLang = 1;
  }
  async insert(data) {
    return await knex(this.#mainTable).insert(data)
  }
  async getPublicPosts(settings) {
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);
    return await knex(this.#mainTable)
      .select()
      .where({ lang: lang, status: "public" })
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);
  }
  async getPublicPostByUrl(url) {
    return await knex(this.#mainTable)
      .select()
      .where({
        permalink: url,
        status: "public",
      })
      .first();
  }
  async getPosts(settings) {
    const limit = "limit" in settings ? settings.limit : this.#defaultLimit;
    const offset = "offset" in settings ? settings.offset : this.#defaultOffset;
    const orderBy = "orderBy" in settings ? settings.orderBy : this.#orderBy;
    const lang = "lang" in settings ? settings.lang : this.#orderBy
    const orderKey =
      "orderKey" in settings ? settings.orderKey : this.#orderKey;

    return await knex(this.#mainTable)
      .select()
        .where({ lang })
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);
  }
  async getPostById(id) {
    return await knex(this.#mainTable).select().where({ id }).first();
  }
  async getByArrTitles(titles, lang) {
    if(!titles.length) return []
    return await knex(this.#mainTable)
        .select()
        .where({ lang })
        .whereIn("title", titles) || [];
  }
  async updateById(id, data) {
    return await knex(this.#mainTable).where({ id: id }).update(data);
  }
  async getTotalCountByLang(lang) {
    const result = await knex(this.#mainTable)
      .where({ lang: lang })
      .count("id");
    return result[0]["count(`id`)"];
  }
  async getAllPostsByLang(lang) {
    return await knex(this.#mainTable).where({ lang });
  }
  async searchByTitle(lang, str) {
    return await knex(this.#mainTable)
      .select()
      .where({ lang: lang })
      .whereILike("title", `%${str}%`);
  }
  async getPublicPostsByArrId(arr) {
    return await knex(this.#mainTable)
      .select()
      .where({ status: "public" })
      .whereIn("id", arr);
  }
  async getPostsByArrId(arr) {
    return await knex(this.#mainTable).select().whereIn("id", arr);
  }
  validateSettings(settings) {
    return {
      limit: "limit" in settings ? settings.limit : this.#defaultLimit,
      offset: "offset" in settings ? settings.offset : this.#defaultOffset,
      orderBy: "orderBy" in settings ? settings.orderBy : this.#orderBy,
      orderKey: "orderKey" in settings ? settings.orderKey : this.#orderKey,
      lang: "lang" in settings ? settings.lang : this.#defaultLang,
      exclude: "exclude" in settings ? settings.exclude : [],
    };
  }
  async getByPermalink(url) {
    return await knex(this.#mainTable)
        .select()
        .where({permalink: url})
        .first();
  }
  async deleteById(id) {
    return await knex(this.#mainTable).where({ id: id }).del();
  }
  async getPostsByParentId(parent_id) {
    return knex(this.#mainTable)
        .select()
        .where({ [`${this.#mainTable + ".parent_id"}`]: parent_id })
  }
  async getPostsByParentIds(parent_ids) {
    if (!parent_ids?.length) return []
    return knex(this.#mainTable)
      .select()
      .whereIn(`${this.#mainTable}.parent_id`, parent_ids)
  }
  async getByPermalinkAndLang(url, lang) {
    return await knex(this.#mainTable)
        .select()
        .where({permalink: url, lang})
        .first();
  }
}
module.exports = CategoryModelKnex;
