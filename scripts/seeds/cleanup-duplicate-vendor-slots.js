/**
 * Удаляет дубли: у провайдера один title (lang=1 public) → остаётся MIN(id).
 * Плюс все языковые копии с permalink дублей (*-1, *-2 …).
 *
 * node scripts/seeds/cleanup-duplicate-vendor-slots.js
 * node scripts/seeds/cleanup-duplicate-vendor-slots.js --apply
 */
require('../../config')
const knex = require('../../db')

const APPLY = process.argv.includes('--apply')

async function run() {
    const [countRow] = await knex.raw(`
        SELECT COUNT(*) AS c FROM slots s
        INNER JOIN slot_vendor_relative svr ON svr.post_id = s.id
        INNER JOIN (
            SELECT s2.title, svr2.relative_id AS vendor_id, MIN(s2.id) AS keep_id
            FROM slots s2
            INNER JOIN slot_vendor_relative svr2 ON svr2.post_id = s2.id
            WHERE s2.lang = 1 AND s2.status = 'public'
            GROUP BY s2.title, svr2.relative_id
            HAVING COUNT(*) > 1
        ) g ON g.title = s.title AND g.vendor_id = svr.relative_id
        WHERE s.lang = 1 AND s.status = 'public' AND s.id <> g.keep_id
    `)
    const lang1Dupes = Number(countRow.c)

    const [permalinkRows] = await knex.raw(`
        SELECT DISTINCT s_dup.permalink
        FROM slots s_dup
        INNER JOIN slot_vendor_relative svr ON svr.post_id = s_dup.id
        INNER JOIN (
            SELECT s2.title, svr2.relative_id AS vendor_id, MIN(s2.id) AS keep_id
            FROM slots s2
            INNER JOIN slot_vendor_relative svr2 ON svr2.post_id = s2.id
            WHERE s2.lang = 1 AND s2.status = 'public'
            GROUP BY s2.title, svr2.relative_id
            HAVING COUNT(*) > 1
        ) g ON g.title = s_dup.title AND g.vendor_id = svr.relative_id
        WHERE s_dup.lang = 1 AND s_dup.status = 'public' AND s_dup.id <> g.keep_id
    `)
    const permalinks = permalinkRows.map((r) => r.permalink).filter(Boolean)

    let translationRows = 0
    if (permalinks.length) {
        const placeholders = permalinks.map(() => '?').join(',')
        const [tr] = await knex.raw(
            `SELECT COUNT(*) AS c FROM slots WHERE permalink IN (${placeholders})`,
            permalinks
        )
        translationRows = Number(tr.c)
    }

    console.log({
        lang1DuplicateRows: lang1Dupes,
        permalinksToPurge: permalinks.length,
        totalRowsWithThosePermalinks: translationRows,
        mode: APPLY ? 'APPLY' : 'DRY-RUN',
    })

    if (!APPLY) {
        console.log('Run with --apply to delete.')
        return
    }

    await knex.raw(`
        DELETE s FROM slots s
        INNER JOIN slot_vendor_relative svr ON svr.post_id = s.id
        INNER JOIN (
            SELECT s2.title, svr2.relative_id AS vendor_id, MIN(s2.id) AS keep_id
            FROM slots s2
            INNER JOIN slot_vendor_relative svr2 ON svr2.post_id = s2.id
            WHERE s2.lang = 1 AND s2.status = 'public'
            GROUP BY s2.title, svr2.relative_id
            HAVING COUNT(*) > 1
        ) g ON g.title = s.title AND g.vendor_id = svr.relative_id
        WHERE s.lang = 1 AND s.status = 'public' AND s.id <> g.keep_id
    `)

    if (permalinks.length) {
        const placeholders = permalinks.map(() => '?').join(',')
        await knex.raw(`DELETE FROM slots WHERE permalink IN (${placeholders})`, permalinks)
    }

    const riddec = await knex('vendors').where({ permalink: 'riddec-games', lang: 1 }).first()
    if (riddec) {
        const [left] = await knex.raw(`
            SELECT COUNT(*) AS c FROM (
                SELECT s.title FROM slots s
                JOIN slot_vendor_relative svr ON svr.post_id = s.id
                WHERE svr.relative_id = ? AND s.lang = 1 AND s.status = 'public'
                GROUP BY s.title HAVING COUNT(*) > 1
            ) t
        `, [riddec.id])
        console.log('riddec-games title dup groups left:', left.c)
    }

    console.log('Done.')
}

run()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
