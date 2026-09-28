const commonFields = require('./commonFields')
module.exports = {
    tableName: 'features',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'feature'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'feature'
        }
    ],
    metaFields: {
        tableName: 'feature_meta',
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
        tableName: 'feature_category',
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
                default: 'feature/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'features'
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
            tableName: 'feature_category_relative',
            mainSchema: 'feature',
            relativeSchema: 'feature'
        },
    }
}