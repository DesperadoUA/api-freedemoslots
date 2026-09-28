const commonFields = require('./commonFields')
module.exports = {
    tableName: 'types',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'type'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'type'
        }
    ],
    metaFields: {
        tableName: 'type_meta',
        fields: [
            {
                type: 'string',
                params: ['text'],
                json: false,
                fn: [],
                default: ''
            }
        ]
    },
    category: {
        tableName: 'type_category',
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
                default: 'type/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'types'
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
            tableName: 'type_category_relative',
            mainSchema: 'type',
            relativeSchema: 'type'
        },
    },
}