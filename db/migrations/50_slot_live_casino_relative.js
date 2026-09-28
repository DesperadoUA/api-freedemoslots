/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const schema = require('../../schemas/slot')

exports.up = function (knex) {
    return knex.schema.createTable(schema.relatives.slot_live_casino_relative.tableName, function (table) {
        table.integer('post_id').unsigned().references('id').inTable('slots').onDelete('CASCADE')
        table.integer('relative_id').unsigned().references('id').inTable('live_casino').onDelete('CASCADE')
    })
}

exports.down = function (knex) {
    return knex.schema.dropTableIfExists(schema.relatives.slot_live_casino_relative.tableName)
}
