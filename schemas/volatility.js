const commonFields = require('./commonFields')
module.exports = {
    tableName: 'volatilities',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'volatility'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'volatility'
        }
    ],
    metaFields: {
        tableName: 'volatility_meta',
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
        tableName: 'volatility_category',
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
                default: 'volatility/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'volatilities'
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
            tableName: 'volatility_category_relative',
            mainSchema: 'volatility',
            relativeSchema: 'volatility'
        },
    },
}