const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const {
    parseLegacyFeatures,
    buildCmsLookups,
    resolveSqlTagNorm
} = require('./feature-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')

async function loadCmsFeatures() {
    const rows = await knex('features').select('id', 'title').where({ lang: 1, parent_id: 0 })
    return buildCmsLookups(rows)
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

    const { slugToFeatures, uniqueTags, parsed, skipped } = await parseLegacyFeatures(SQL_PATH)
    console.log({
        parsedLines: parsed,
        skippedLines: skipped,
        slotsWithFeatures: slugToFeatures.size,
        uniqueTagsInSql: uniqueTags.size
    })

    const lookups = await loadCmsFeatures()
    let resolvedTags = 0
    for (const sqlNorm of uniqueTags.keys()) {
        if (resolveSqlTagNorm(sqlNorm, lookups)) resolvedTags++
    }
    console.log({ sqlTagsResolved: resolvedTags, sqlTagsMissing: uniqueTags.size - resolvedTags })

    const permalinkToSlotId = await loadPermalinkSlotIds()
    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0
    let tagsSkipped = 0

    for (const [slug, featureNorms] of slugToFeatures.entries()) {
        const slotId = permalinkToSlotId.get(slug)
        if (!slotId) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        for (const sqlNorm of featureNorms) {
            const entry = resolveSqlTagNorm(sqlNorm, lookups)
            if (!entry) {
                tagsSkipped++
                continue
            }
            relations.push({ post_id: slotId, relative_id: entry.id })
        }
    }

    const slotIds = [...new Set(relations.map((r) => r.post_id))]
    console.log(`Replacing feature links for ${slotIds.length} EN slots...`)

    const chunkDel = 1000
    for (let i = 0; i < slotIds.length; i += chunkDel) {
        await knex('slot_feature_relative')
            .whereIn('post_id', slotIds.slice(i, i + chunkDel))
            .del()
    }

    const chunkIns = 500
    for (let i = 0; i < relations.length; i += chunkIns) {
        await knex('slot_feature_relative').insert(relations.slice(i, i + chunkIns))
    }

    console.log({
        matchedSlugs,
        missingSlugs,
        tagsSkipped,
        relationsInserted: relations.length
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
