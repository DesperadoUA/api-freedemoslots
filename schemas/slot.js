const commonFields = require("./commonFields");
const vendorSchema = require('./vendor')
const themeSchema = require('./theme')
const featureSchema = require('./feature')
const typeSchema = require('./type')
const volatilitySchema = require('./volatility')
const seriesSchema = require('./series')
const liveCasinoSchema = require('./live_casino')
module.exports = {
  tableName: "slots",
  orderBy: "created_at",
  fields: [
    ...commonFields,
    {
      type: "string",
      params: ["post_type"],
      fn: [],
      default: "slot",
    },
    {
      type: "string",
      params: ["slug"],
      fn: [],
      default: "slot",
    },
  ],
  metaFields: {
    tableName: "slot_meta",
    fields: [
      {
        type: "string",
        params: ["demo"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["faq"],
        json: true,
        fn: [],
        default: [],
      },
      {
        type: "string",
        params: ["faq_title"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["release_date"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["rtp"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["paylines"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["reels"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["layout"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["min_bet"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["max_bet"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "string",
        params: ["max_win"],
        json: false,
        fn: [],
        default: "",
      },
      {
        type: "integer",
        params: ["best"],
        json: false,
        fn: [],
        default: 0,
      },
    ],
  },
  category: {
    tableName: "slot_category",
    fields: [
      ...commonFields,
      {
        type: "text",
        params: ["faq"],
        fn: [],
        default: [],
      },
      {
        type: "string",
        params: ["post_type"],
        fn: [],
        default: "w_slot/category",
      },
      {
        type: "string",
        params: ["slug"],
        fn: [],
        default: "slots",
      },
      {
        type: "integer",
        params: ["parent_id"],
        fn: [],
        default: 0,
      },
    ],
  },
  relatives: {
    category: {
      tableName: "slot_category_relative",
      mainSchema: "slot",
      relativeSchema: "slot",
    },
    slot_vendor_relative: {
      tableName: 'slot_vendor_relative',
      mainSchema: 'slot',
      relativeSchema: 'vendor',
      mainTable: 'slots',
      relativeTable: vendorSchema
    },
    slot_theme_relative: {
      tableName: 'slot_theme_relative',
      mainSchema: 'slot',
      relativeSchema: 'theme',
      mainTable: 'slots',
      relativeTable: themeSchema
    },
    slot_feature_relative: {
      tableName: 'slot_feature_relative',
      mainSchema: 'slot',
      relativeSchema: 'feature',
      mainTable: 'slots',
      relativeTable: featureSchema
    },
    slot_type_relative: {
      tableName: 'slot_type_relative',
      mainSchema: 'slot',
      relativeSchema: 'type',
      mainTable: 'slots',
      relativeTable: typeSchema
    },
    slot_volatility_relative: {
      tableName: 'slot_volatility_relative',
      mainSchema: 'slot',
      relativeSchema: 'volatility',
      mainTable: 'slots',
      relativeTable: volatilitySchema
    },
    slot_series_relative: {
      tableName: 'slot_series_relative',
      mainSchema: 'slot',
      relativeSchema: 'series',
      mainTable: 'slots',
      relativeTable: seriesSchema
    },
    slot_live_casino_relative: {
      tableName: 'slot_live_casino_relative',
      mainSchema: 'slot',
      relativeSchema: 'live_casino',
      mainTable: 'slots',
      relativeTable: liveCasinoSchema
    }
  }
};
