/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const schema = require('../../schemas/vendor')
exports.up = function (knex) {
    return knex.schema.createTable(schema.translates.tableName, function (table) {
        table.integer('post_id').unsigned().references('id').inTable(schema.translates.mainTable)
        table.integer('relative_id').unsigned().references('id').inTable(schema.translates.mainTable)
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schemas.dropTable(schema.translates.tableName)
}