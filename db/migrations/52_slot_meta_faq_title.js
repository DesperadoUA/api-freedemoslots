/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const schema = require('../../schemas/slot')

exports.up = function (knex) {
    const field = schema.metaFields.fields.find((f) => f.params[0] === 'faq_title')
    return knex.schema.alterTable(schema.metaFields.tableName, (table) => {
        const col = table[field.type](...field.params)
        field.fn.forEach((fn) => col[fn]())
        if (field.default !== null) col.defaultTo(field.default)
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable(schema.metaFields.tableName, (table) => {
        table.dropColumn('faq_title')
    })
}
