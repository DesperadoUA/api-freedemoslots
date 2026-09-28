const commonFields = require("./commonFields");
module.exports = {
    tableName: "settings",
    fields: [
        {
            type: "string",
            params: ["slug"],
            fn: [],
            default: "settings",
        },
        {
            type: "string",
            params: ["key_id"],
            fn: [],
            default: "",
        },
        {
            type: "string",
            params: ["title"],
            fn: [],
            default: "",
        },
        {
            type: 'longtext',
            params: ['value'],
            fn: [],
            default: ""
        },
        {
            type: "string",
            params: ["editor"],
            fn: [],
            default: "image",
        },
        {
            type: 'integer',
            params: ['lang'],
            fn: [],
            default: 1
        },
    ]
};
