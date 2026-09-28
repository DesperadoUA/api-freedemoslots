const commonFields = require('./commonFields')
module.exports = {
    tableName: 'themes',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'theme'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'theme'
        }
    ],
    metaFields: {
        tableName: 'theme_meta',
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
        tableName: 'theme_category',
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
                default: 'theme/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'themes'
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
            tableName: 'theme_category_relative',
            mainSchema: 'theme',
            relativeSchema: 'theme'
        },
    },
}