module.exports = {
  tableName: "users",
  orderBy: "created_at",
  fields: [
    {
      type: "string",
      params: ["name"],
      fn: ["unique"],
      default: "",
    },
    {
      type: "string",
      params: ["email"],
      fn: ["unique"],
      default: "",
    },
    {
      type: "string",
      params: ["password"],
      fn: [],
      default: "",
    },
    {
      type: "string",
      params: ["remember_token"],
      fn: [],
      default: "",
    },
    {
      type: "enu",
      params: ["role", ["editor", "admin", "guest"]],
      fn: [],
      default: "editor",
    },
    {
      type: "timestamp",
      params: ["created_at"],
      fn: [],
      default: null,
    },
    {
      type: "timestamp",
      params: ["updated_at"],
      fn: [],
      default: null,
    },
  ],
};
