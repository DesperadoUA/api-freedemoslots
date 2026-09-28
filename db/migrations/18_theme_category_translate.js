/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const schema = require('../../schemas/theme')
exports.up = function (knex) {
    return knex.schema.createTable(schema.translates.categoryTableName, function (table) {
        table.integer('post_id').unsigned().references('id').inTable(schema.translates.categoryTable)
        table.integer('relative_id').unsigned().references('id').inTable(schema.translates.categoryTable)
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schemas.dropTable(schema.translates.categoryTableName)
}