/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const schema = require('../../schemas/slot')
exports.up = function (knex) {
    return knex.schema.createTable(schema.relatives.slot_vendor.tableName, function (table) {
        table.integer('post_id').unsigned().references('id').inTable('slots').onDelete('CASCADE')
        table.integer('relative_id').unsigned().references('id').inTable('vendors').onDelete('CASCADE')
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schemas.dropTable(schema.relatives.slot_vendor.tableName)
}