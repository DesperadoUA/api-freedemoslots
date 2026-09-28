const commonFields = require('./commonFields')
module.exports = {
    tableName: 'vendors',
    orderBy: 'rating',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'vendor'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'vendor'
        }
    ],
    metaFields: {
        tableName: 'vendor_meta',
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
        tableName: 'vendor_category',
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
                default: 'vendor/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'vendors'
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
            tableName: 'vendor_category_relative',
            mainSchema: 'vendor',
            relativeSchema: 'vendor'
        },
    },
}