const commonFields = require("./commonFields");
module.exports = {
    tableName: "options",
    fields: [
        {
            type: "string",
            params: ["slug"],
            fn: [],
            default: "options",
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
        }
    ]
};
