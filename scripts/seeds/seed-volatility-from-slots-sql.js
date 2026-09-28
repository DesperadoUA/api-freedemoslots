const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const { parseLegacyVolatility, PROD_VOLATILITIES, canonicalVolatility } = require('./volatility-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')

async function loadVolatilityByTitle() {
    const rows = await knex('volatilities').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const map = new Map()
    for (const row of rows) {
        map.set(row.title.toLowerCase(), row.id)
    }
    return map
}

async function loadPermalinkSlotIds() {
    const rows = await knex('slots').select('id', 'permalink').where({ lang: 1 })
    const map = new Map()
    for (const row of rows) {
        const key = String(row.permalink || '').toLowerCase()
        if (!key) continue
        if (!map.has(key)) map.set(key, row.id)
    }
    return map
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    const prodKeys = new Set(PROD_VOLATILITIES.map((t) => t.toLowerCase()))
    const { slugToVolatility, uniqueValues, parsed, skipped } = await parseLegacyVolatility(SQL_PATH)
    console.log({ parsedLines: parsed, skippedLines: skipped, slotsWithVolatility: slugToVolatility.size, uniqueValues: uniqueValues.size })

    const volByTitle = await loadVolatilityByTitle()
    const permalinkToSlotId = await loadPermalinkSlotIds()

    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0
    let skippedNonProd = 0

    for (const [slug, rawVol] of slugToVolatility.entries()) {
        const slotId = permalinkToSlotId.get(slug)
        if (!slotId) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        const canonical = canonicalVolatility(rawVol)
        if (!canonical || !prodKeys.has(canonical.toLowerCase())) {
            skippedNonProd++
            continue
        }
        const volId = volByTitle.get(canonical.toLowerCase())
        if (!volId) continue
        relations.push({ post_id: slotId, relative_id: volId })
    }

    const slotIds = [...new Set(relations.map((r) => r.post_id))]
    console.log(`Replacing volatility links for ${slotIds.length} EN slots...`)

    const chunkDel = 1000
    for (let i = 0; i < slotIds.length; i += chunkDel) {
        await knex('slot_volatility_relative')
            .whereIn('post_id', slotIds.slice(i, i + chunkDel))
            .del()
    }

    const chunkIns = 500
    for (let i = 0; i < relations.length; i += chunkIns) {
        await knex('slot_volatility_relative').insert(relations.slice(i, i + chunkIns))
    }

    const counts = {}
    for (const title of PROD_VOLATILITIES) {
        const id = volByTitle.get(title.toLowerCase())
        if (!id) continue
        const row = await knex('slot_volatility_relative as svr')
            .join('slots as s', 's.id', 'svr.post_id')
            .where('svr.relative_id', id)
            .where({ 's.lang': 1, 's.status': 'public' })
            .countDistinct({ c: 's.id' })
        counts[title] = Number(row[0].c)
    }

    console.log({
        matchedSlugs,
        missingSlugs,
        skippedNonProdVolatility: skippedNonProd,
        relationsInserted: relations.length,
        publicSlotCounts: counts
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
