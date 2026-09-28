const commonFields = require('./commonFields')

module.exports = {
    tableName: 'series',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'series'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'series'
        },
        {
            type: 'integer',
            params: ['parent_id'],
            fn: [],
            default: 0
        }
    ],
    metaFields: {
        tableName: 'series_meta',
        fields: [
            {
                type: 'integer',
                params: ['rating'],
                json: false,
                fn: [],
                default: 0
            }
        ]
    },
    category: {
        tableName: 'series_category',
        fields: [
            ...commonFields,
            {
                type: 'text',
                params: ['faq'],
                fn: [],
                default: []
            },
            {
                type: 'string',
                params: ['post_type'],
                fn: [],
                default: 'series/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'series'
            },
            {
                type: 'integer',
                params: ['parent_id'],
                fn: [],
                default: 0
            }
        ]
    },
    relatives: {
        category: {
            tableName: 'series_category_relative',
            mainSchema: 'series',
            relativeSchema: 'series'
        }
    }
}
