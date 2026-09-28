const commonFields = require("./commonFields");
module.exports = {
  tableName: "pages",
  orderBy: "created_at",
  fields: [
    ...commonFields,
    {
      type: "string",
      params: ["post_type"],
      fn: [],
      default: "page",
    }
  ],
  translates: {
    tableName: 'page_translate',
    categoryTableName: '',
    mainTable: 'pages',
    categoryTable: '',
    ids: [1, 2]
  }
};
