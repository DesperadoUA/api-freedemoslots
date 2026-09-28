const knex = require("../db");
const CategoryModel = require("./CategoryKnex");
const RelativeModel = require("./RelativeKnex");
class PostsModelKnex {
  #mainTable;
  #metaTable;
  #defaultLimit;
  #defaultOffset;
  #orderBy;
  #orderKey;
  #defaultLang;
  #relatives;
  #relativeModel;
  constructor(schema) {
    this.schema = schema;
    this.#mainTable = schema.tableName;
    this.#metaTable = schema.metaFields.tableName;
    this.#defaultLimit = 8;
    this.#defaultOffset = 0;
    this.#orderBy = schema.orderBy;
    this.#orderKey = "DESC";
    this.#defaultLang = 1;
    this.#relatives = Object.keys(this.schema.relatives);
    this.#relativeModel = new RelativeModel(schema);
  }

  /** Один слот на title у провайдера (убирает дубли orbital-rush / orbital-rush-1) */
  #applyVendorUniqueSlots(query, vendorId, lang) {
    return query.whereIn("s.id", function () {
      this.select(knex.raw("MIN(s_u.id)"))
        .from("slots as s_u")
        .join("slot_vendor_relative as svr_u", "svr_u.post_id", "s_u.id")
        .where({
          "svr_u.relative_id": vendorId,
          "s_u.status": "public",
          "s_u.lang": lang,
        })
        .groupBy("s_u.title");
    });
  }

  async getPublicPostsWithoutRelatives(settings) {
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);
    const data = await knex(this.#mainTable)
      .select(`${this.#mainTable}.*`)
      .where({ lang, status: "public" })
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);
    return data || [];
  }

  async getPublicPosts(settings) {
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);
    const data = await knex(this.#mainTable)
      .select()
      .where({ lang: lang, status: "public" })
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getPublicRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async getPublicPostsWithOutIds(settings) {
    const { limit, offset, orderBy, orderKey, lang, exclude } =
      this.validateSettings(settings);
    const data = await knex(this.#mainTable)
      .select()
      .where({ lang: lang, status: "public" })
      .whereNotIn("id", exclude)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);

    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  /** Публичный пост + meta, без relatives */
  async getPublicPostWithMetaByUrl(url, lang) {
    return knex(this.#mainTable)
      .select()
      .where({
        [`${this.#mainTable + ".permalink"}`]: url,
        status: "public",
        lang: lang,
      })
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .first();
  }

  async getPublicPostByUrl(url, lang) {
    const data = await this.getPublicPostWithMetaByUrl(url, lang);
    if (data) {
      const relative = await this.getPublicRelativesById(data.id);
      return { ...data, ...relative };
    }
  }

  /** Публичный слот по permalink слота и провайдера — один запрос, без загрузки всего каталога */
  async getPublicPostByVendorPermalink(slotPermalink, vendorPermalink, lang) {
    if (this.#mainTable !== "slots") return;

    const data = await knex("slots as s")
      .select(knex.raw("s.*"), knex.raw("sm.*"))
      .join("slot_meta as sm", "sm.post_id", "s.id")
      .where({
        "s.permalink": slotPermalink,
        "s.lang": lang,
        "s.status": "public",
      })
      .whereExists(function () {
        this.select(knex.raw("1"))
          .from("slot_vendor_relative as svr")
          .join("vendors as v", function () {
            this.on("v.id", "svr.relative_id");
          })
          .whereRaw("svr.post_id = s.id")
          .where({
            "v.permalink": vendorPermalink,
            "v.status": "public",
            "v.lang": lang,
          });
      })
      .first();

    if (!data) return;

    const relative = await this.getPublicSlotPageRelativesById(data.id);
    return { ...data, ...relative };
  }

  /** Relatives для страницы слота — только provider, themes, features, volatility */
  async getPublicSlotPageRelativesById(id) {
    const keys = [
      "slot_vendor_relative",
      "slot_theme_relative",
      "slot_feature_relative",
      "slot_volatility_relative",
    ];
    const objRelatives = {};
    await Promise.all(
      keys.map(async (relative) => {
        objRelatives[relative] = await this.#relativeModel.getRelativeByPostId(
          id,
          relative
        );
      })
    );

    const data = {};
    await Promise.all(
      keys.map(async (key) => {
        const relativeSchema = require(`./../schemas/${this.schema.relatives[key].relativeSchema}`);
        const model = new PostsModelKnex(relativeSchema);
        data[key] = await model.getPublicPostsByArrId(objRelatives[key]);
      })
    );
    return data;
  }
  async insert(commonData, metaData) {
    const insertId = await knex(this.#mainTable).insert(commonData);
    await knex(this.#metaTable).insert({ ...metaData, post_id: insertId });
    return insertId;
  }
  async getTotalCountPublicByLang(lang) {
    const result = await knex(this.#mainTable)
      .where({ lang: lang, status: "public" })
      .count("id");
    return result[0]["count(`id`)"];
  }
  async getPostById(id) {
    let data = await knex(this.#mainTable)
      .select()
      .where({ [`${this.#mainTable + ".id"}`]: id })
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .first();
    if (data) {
      const relative = await this.getRelativesById(id);
      data = { ...data, ...relative };
      return data;
    } else return;
  }
  async updateById(id, data) {
    return await knex(this.#mainTable).where({ id: id }).update(data);
  }
  async getByPermalink(url) {
    let data = await knex(this.#mainTable)
      .select()
      .where({
        [`${this.#mainTable + ".permalink"}`]: url,
      })
      .first();
    return data
  }
  async getPosts(settings) {
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);
    let data = await knex(this.#mainTable)
      .select()
      .where({ lang: lang })
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .offset(offset)
      .limit(limit)
      .orderBy(orderBy, orderKey);
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async getTotalCountByLang(lang) {
    const result = await knex(this.#mainTable)
      .where({ lang: lang })
      .count("id");
    return result[0]["count(`id`)"];
  }
  async updateMetaById(id, data) {
    return await knex(this.#metaTable).where({ post_id: id }).update(data);
  }
  async searchByTitle(lang, str) {
    const data = await knex(this.#mainTable)
      .select()
      .where({ lang: lang })
      .whereILike("title", `%${str}%`)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      );
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async searchPublicByTitle(lang, str) {
    const data = await knex(this.#mainTable)
      .select()
      .where({ lang: lang, status: "public" })
      .whereILike("title", `%${str}%`)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      );
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async getPublicPostsByArrId(arr) {
    const data = await knex(this.#mainTable)
      .select()
      .where({ status: "public" })
      .whereIn("id", arr)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .orderBy(this.#orderBy, this.#orderKey);
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getPublicRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async getPostsByArrId(arr) {
    const data = await knex(this.#mainTable)
      .select()
      .whereIn("id", arr)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .orderBy(this.#orderBy, this.#orderKey);
    if (data) {
      for (const [index, post] of data.entries()) {
        const relative = await this.getRelativesById(post.id);
        data[index] = { ...data[index], ...relative };
      }
      return data;
    } else return [];
  }
  async deleteById(id) {
    return await knex(this.#mainTable).where({ id: id }).del();
  }
  async getRelativesById(id) {
    const data = {};
    const objRelatives = {};
    for await (const relative of this.#relatives) {
      objRelatives[relative] = await this.#relativeModel.getRelativeByPostId(
        id,
        relative
      );
    }
    for await (const key of Object.keys(objRelatives)) {
      const relativeSchema = require(`./../schemas/${this.schema.relatives[key].relativeSchema}`);
      const model =
        key === "category"
          ? new CategoryModel(relativeSchema)
          : new PostsModelKnex(relativeSchema);
      data[key] = await model.getPostsByArrId(objRelatives[key]);
    }
    return data;
  }
  /**
   * Публичные слоты, у которых есть хотя бы один публичный провайдер (главная).
   */
  async getPublicWithPublicVendor(settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const idRows = await knex("slots as s")
      .select("s.id")
      .where({ "s.lang": lang, "s.status": "public" })
      .whereExists(function () {
        this.select(knex.raw("1"))
          .from("slot_vendor_relative as svr")
          .join("vendors as v", function () {
            this.on("v.id", "svr.relative_id");
          })
          .whereRaw("svr.post_id = s.id")
          .where({ "v.status": "public", "v.lang": lang });
      })
      .orderBy(`s.${orderBy}`, orderKey)
      .limit(limit)
      .offset(offset);

    const ids = idRows.map((r) => r.id);
    if (!ids.length) return [];

    const slots = await knex(this.#mainTable)
      .select(`${this.#mainTable}.*`)
      .whereIn(`${this.#mainTable}.id`, ids)
      .join(
        this.#metaTable,
        `${this.#mainTable}.id`,
        "=",
        `${this.#metaTable}.post_id`
      )
      .orderBy(orderBy, orderKey);

    const vendorRows = await knex("slot_vendor_relative as svr")
      .join("vendors as v", "v.id", "svr.relative_id")
      .whereIn("svr.post_id", ids)
      .where({ "v.status": "public", "v.lang": lang })
      .select("svr.post_id", "v.id", "v.title", "v.permalink")
      .orderBy("v.id", "asc");

    const vendorsBySlot = new Map();
    for (const row of vendorRows) {
      if (!vendorsBySlot.has(row.post_id)) vendorsBySlot.set(row.post_id, []);
      vendorsBySlot.get(row.post_id).push(row);
    }

    return slots.map((slot) => ({
      ...slot,
      slot_vendor_relative: vendorsBySlot.get(slot.id) || [],
    }));
  }

  /** Уникальные типы игр по всем public-слотам провайдера (types + live) */
  async getPublicGameTypesByVendorId(vendorId, lang = 1) {
    if (this.#mainTable !== "slots") return [];

    const types = await knex("types as t")
      .join("slot_type_relative as str", "str.relative_id", "t.id")
      .join("slots as s", "s.id", "str.post_id")
      .join("slot_vendor_relative as svr", "svr.post_id", "s.id")
      .where({
        "svr.relative_id": vendorId,
        "s.status": "public",
        "s.lang": lang,
        "t.status": "public",
        "t.lang": lang,
        "t.parent_id": 0,
      })
      .distinct("t.id", "t.title", "t.permalink")
      .orderBy("t.title")
      .select("t.title", "t.permalink");

    const liveTypes = await knex("live_casino as lc")
      .join("slot_live_casino_relative as slcr", "slcr.relative_id", "lc.id")
      .join("slots as s", "s.id", "slcr.post_id")
      .join("slot_vendor_relative as svr", "svr.post_id", "s.id")
      .where({
        "svr.relative_id": vendorId,
        "s.status": "public",
        "s.lang": lang,
        "lc.status": "public",
        "lc.lang": lang,
        "lc.parent_id": 0,
      })
      .distinct("lc.id", "lc.title", "lc.permalink")
      .orderBy("lc.title")
      .select("lc.title", "lc.permalink");

    const byPermalink = new Map();
    for (const row of [...types, ...liveTypes]) {
      const key = String(row.permalink || "").toLowerCase();
      if (!key || byPermalink.has(key)) continue;
      byPermalink.set(key, {
        title: row.title,
        permalink: row.permalink,
      });
    }

    return [...byPermalink.values()].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }

  /** Лучшие public-слоты провайдера (slot_meta.best = 1), без relatives */
  async getPublicBestPostsByVendorId(vendorId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    return knex("slots as s")
      .select("s.title", "s.permalink", "s.thumbnail", "sm.best")
      .join("slot_meta as sm", "sm.post_id", "s.id")
      .join("slot_vendor_relative as svr", "svr.post_id", "s.id")
      .where({
        "svr.relative_id": vendorId,
        "s.status": "public",
        "s.lang": lang,
        "sm.best": 1,
      })
      .orderBy("s.created_at", "DESC")
      .limit(limit);
  }

  /** Новинки провайдера по дате релиза (slot_meta.release_date), без relatives */
  async getPublicLatestPostsByVendorId(vendorId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    return knex("slots as s")
      .select("s.title", "s.permalink", "s.thumbnail", "sm.best", "sm.release_date")
      .join("slot_meta as sm", "sm.post_id", "s.id")
      .join("slot_vendor_relative as svr", "svr.post_id", "s.id")
      .where({
        "svr.relative_id": vendorId,
        "s.status": "public",
        "s.lang": lang,
      })
      .whereRaw("sm.release_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'")
      .orderBy("sm.release_date", "DESC")
      .limit(limit);
  }

  #applyPublicVendorExists(qb, lang, slotAlias = "s") {
    return qb.whereExists(function () {
      this.select(knex.raw("1"))
        .from("slot_vendor_relative as svr")
        .join("vendors as v", function () {
          this.on("v.id", "svr.relative_id").andOn(
            "v.lang",
            knex.raw("?", [lang])
          );
        })
        .whereRaw(`svr.post_id = ${slotAlias}.id`)
        .where({ "v.status": "public" });
    });
  }

  async attachPublicVendorsToSlots(rows, lang = 1) {
    if (!rows?.length) return [];
    const ids = rows.map((r) => r.id).filter(Boolean);
    if (!ids.length) return rows;

    const vendorRows = await knex("slot_vendor_relative as svr")
      .join("vendors as v", "v.id", "svr.relative_id")
      .whereIn("svr.post_id", ids)
      .where({ "v.status": "public", "v.lang": lang })
      .select("svr.post_id", "v.title", "v.permalink")
      .orderBy("v.id", "asc");

    const vendorsBySlot = new Map();
    for (const row of vendorRows) {
      if (!vendorsBySlot.has(row.post_id)) {
        vendorsBySlot.set(row.post_id, []);
      }
      vendorsBySlot.get(row.post_id).push(row);
    }

    return rows.map((row) => ({
      ...row,
      slot_vendor_relative: vendorsBySlot.get(row.id) || [],
    }));
  }

  /** Лучшие public-слоты темы (slot_meta.best = 1) */
  async getPublicBestPostsByThemeId(themeId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_theme_relative as str", "str.post_id", "s.id")
        .where({
          "str.relative_id": themeId,
          "s.status": "public",
          "s.lang": lang,
          "sm.best": 1,
        })
        .orderBy("s.created_at", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Новинки темы по release_date */
  async getPublicLatestPostsByThemeId(themeId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select(
          "s.id",
          "s.title",
          "s.permalink",
          "s.thumbnail",
          "sm.best",
          "sm.release_date"
        )
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_theme_relative as str", "str.post_id", "s.id")
        .where({
          "str.relative_id": themeId,
          "s.status": "public",
          "s.lang": lang,
        })
        .whereRaw("sm.release_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'")
        .orderBy("sm.release_date", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Лучшие public-слоты фичи (slot_meta.best = 1) */
  async getPublicBestPostsByFeatureId(featureId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_feature_relative as sfr", "sfr.post_id", "s.id")
        .where({
          "sfr.relative_id": featureId,
          "s.status": "public",
          "s.lang": lang,
          "sm.best": 1,
        })
        .orderBy("s.created_at", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Новинки фичи по release_date */
  async getPublicLatestPostsByFeatureId(featureId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select(
          "s.id",
          "s.title",
          "s.permalink",
          "s.thumbnail",
          "sm.best",
          "sm.release_date"
        )
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_feature_relative as sfr", "sfr.post_id", "s.id")
        .where({
          "sfr.relative_id": featureId,
          "s.status": "public",
          "s.lang": lang,
        })
        .whereRaw("sm.release_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'")
        .orderBy("sm.release_date", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты фичи — пагинация в БД */
  async getPublicPostsByFeatureId(featureId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_feature_relative as sfr", "sfr.post_id", "s.id")
        .where({
          "sfr.relative_id": featureId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Лучшие public-слоты волатильности (slot_meta.best = 1) */
  async getPublicBestPostsByVolatilityId(volatilityId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_volatility_relative as svlr", "svlr.post_id", "s.id")
        .where({
          "svlr.relative_id": volatilityId,
          "s.status": "public",
          "s.lang": lang,
          "sm.best": 1,
        })
        .orderBy("s.created_at", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Новинки волатильности по release_date */
  async getPublicLatestPostsByVolatilityId(volatilityId, lang = 1, limit = 12) {
    if (this.#mainTable !== "slots") return [];

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select(
          "s.id",
          "s.title",
          "s.permalink",
          "s.thumbnail",
          "sm.best",
          "sm.release_date"
        )
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_volatility_relative as svlr", "svlr.post_id", "s.id")
        .where({
          "svlr.relative_id": volatilityId,
          "s.status": "public",
          "s.lang": lang,
        })
        .whereRaw("sm.release_date REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}'")
        .orderBy("sm.release_date", "DESC")
        .limit(limit),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты волатильности — пагинация в БД */
  async getPublicPostsByVolatilityId(volatilityId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_volatility_relative as svlr", "svlr.post_id", "s.id")
        .where({
          "svlr.relative_id": volatilityId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты серии — пагинация в БД */
  async getPublicPostsBySeriesId(seriesId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_series_relative as ssr", "ssr.post_id", "s.id")
        .where({
          "ssr.relative_id": seriesId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты типа игры — пагинация в БД */
  async getPublicPostsByTypeId(typeId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_type_relative as str", "str.post_id", "s.id")
        .where({
          "str.relative_id": typeId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты live casino — пагинация в БД */
  async getPublicPostsByLiveCasinoId(liveCasinoId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_live_casino_relative as slcr", "slcr.post_id", "s.id")
        .where({
          "slcr.relative_id": liveCasinoId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты темы — пагинация в БД */
  async getPublicPostsByThemeId(themeId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang } =
      this.validateSettings(settings);

    const rows = await this.#applyPublicVendorExists(
      knex("slots as s")
        .select("s.id", "s.title", "s.permalink", "s.thumbnail", "sm.best")
        .join("slot_meta as sm", "sm.post_id", "s.id")
        .join("slot_theme_relative as str", "str.post_id", "s.id")
        .where({
          "str.relative_id": themeId,
          "s.status": "public",
          "s.lang": lang,
        })
        .orderBy(`s.${orderBy}`, orderKey)
        .limit(limit)
        .offset(offset),
      lang
    );

    return this.attachPublicVendorsToSlots(rows, lang);
  }

  /** Публичные слоты одного провайдера — пагинация в БД, без relatives */
  async getPublicPostsByVendorId(vendorId, settings) {
    if (this.#mainTable !== "slots") return [];
    const { limit, offset, orderBy, orderKey, lang, exclude } =
      this.validateSettings(settings);

    let query = knex("slots as s")
      .select("s.title", "s.permalink", "s.thumbnail", "sm.best")
      .join("slot_meta as sm", "sm.post_id", "s.id")
      .join("slot_vendor_relative as svr", "svr.post_id", "s.id")
      .where({
        "svr.relative_id": vendorId,
        "s.status": "public",
        "s.lang": lang,
      });

    if (exclude?.length) {
      query = query.whereNotIn("s.id", exclude);
    }

    return query
      .orderBy(`s.${orderBy}`, orderKey)
      .limit(limit)
      .offset(offset);
  }

  async countPublicSlotsByVendorIds(vendorIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByVendorIds(vendorIds, lang);
  }

  async countPublicSlotsByThemeIds(themeIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByThemeIds(themeIds, lang);
  }

  async countPublicSlotsByVolatilityIds(volatilityIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByVolatilityIds(volatilityIds, lang);
  }

  async countPublicSlotsBySeriesIds(seriesIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsBySeriesIds(seriesIds, lang);
  }

  async countPublicSlotsByFeatureIds(featureIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByFeatureIds(featureIds, lang);
  }

  async countPublicSlotsByTypeIds(typeIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByTypeIds(typeIds, lang);
  }

  async countPublicSlotsByLiveCasinoIds(liveCasinoIds, lang) {
    if (this.#mainTable !== "slots") return new Map();
    return this.#relativeModel.countPublicSlotsByLiveCasinoIds(liveCasinoIds, lang);
  }

  async getPublicRelativesById(id) {
    const objRelatives = {};
    await Promise.all(
      this.#relatives.map(async (relative) => {
        objRelatives[relative] = await this.#relativeModel.getRelativeByPostId(
          id,
          relative
        );
      })
    );

    const data = {};
    await Promise.all(
      Object.keys(objRelatives).map(async (key) => {
        const relativeSchema = require(`./../schemas/${this.schema.relatives[key].relativeSchema}`);
        const model =
          key === "category"
            ? new CategoryModel(relativeSchema)
            : new PostsModelKnex(relativeSchema);
        data[key] = await model.getPublicPostsByArrId(objRelatives[key]);
      })
    );
    return data;
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
  async getAllPostsByLang(lang) {
    return await knex(this.#mainTable).where({ lang });
  }
  async getByArrTitles(titles, lang) {
    if(!titles.length) return []
    return await knex(this.#mainTable)
        .select()
        .where({ lang })
        .whereIn("title", titles) || [];
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
  /** Конфликт permalink среди слотов одного провайдера (без загрузки relatives) */
  async getByVendorPermalink(vendorId, permalink, excludePostId = null) {
    if (this.#mainTable !== "slots") return null
    let q = knex("slots as s")
      .select("s.id")
      .join("slot_vendor_relative as svr", "s.id", "svr.post_id")
      .where("svr.relative_id", vendorId)
      .where("s.permalink", permalink)
    if (excludePostId) q = q.whereNot("s.id", excludePostId)
    return q.first()
  }
  async getByPermalinkAndLang(url, lang) {
    let data = await knex(this.#mainTable)
        .select()
        .where({
          [`${this.#mainTable + ".permalink"}`]: url,
          [`${this.#mainTable + ".lang"}`]: lang,
        })
        .first();
    return data
  }
  async fetch() {
    let data = await knex(this.#mainTable)
        .select()
    return data ? data : []
  }
  async getByTitle(title) {
    let data = await knex(this.#mainTable)
        .select()
        .where({
          [`${this.#mainTable + ".title"}`]: title,
        });
    return data
  }
}
module.exports = PostsModelKnex;
