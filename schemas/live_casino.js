const commonFields = require('./commonFields')

module.exports = {
    tableName: 'live_casino',
    orderBy: 'created_at',
    fields: [
        ...commonFields,
        {
            type: 'string',
            params: ['post_type'],
            fn: [],
            default: 'live_casino'
        },
        {
            type: 'string',
            params: ['slug'],
            fn: [],
            default: 'live_casino'
        },
        {
            type: 'integer',
            params: ['parent_id'],
            fn: [],
            default: 0
        }
    ],
    metaFields: {
        tableName: 'live_casino_meta',
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
        tableName: 'live_casino_category',
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
                default: 'live_casino/category'
            },
            {
                type: 'string',
                params: ['slug'],
                fn: [],
                default: 'live_casino'
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
            tableName: 'live_casino_category_relative',
            mainSchema: 'live_casino',
            relativeSchema: 'live_casino'
        }
    }
}
