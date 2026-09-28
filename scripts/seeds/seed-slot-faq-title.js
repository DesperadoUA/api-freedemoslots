require('../../config')
const knex = require('../../db')

/**
 * Заполняет slot_meta.faq_title по маске: FAQ about {title слота}
 */
async function main() {
    const result = await knex.raw(`
        UPDATE slot_meta sm
        INNER JOIN slots s ON s.id = sm.post_id
        SET sm.faq_title = CONCAT('FAQ about ', TRIM(s.title))
    `)

    const affected = result[0]?.affectedRows ?? result?.rowCount ?? 0
    const sample = await knex('slots as s')
        .join('slot_meta as sm', 'sm.post_id', 's.id')
        .where('s.lang', 1)
        .select('s.title', 'sm.faq_title')
        .limit(3)

    console.log(JSON.stringify({ updated: affected, sample }, null, 2))
    await knex.destroy()
}

main().catch(async (err) => {
    console.error(err)
    await knex.destroy()
    process.exit(1)
})
