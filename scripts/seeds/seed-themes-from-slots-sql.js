const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const {
    parseLegacyThemes,
    normalizeTheme,
    resolveSqlTagNorm
} = require('./theme-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')

async function loadCmsThemesByNorm() {
    const rows = await knex('themes').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const cmsByNorm = new Map()
    for (const row of rows) {
        cmsByNorm.set(normalizeTheme(row.title), { id: row.id, title: row.title })
    }
    return cmsByNorm
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

    console.log(`Parsing ${SQL_PATH}...`)
    const { slugToThemes, uniqueTags, parsed, skipped } = await parseLegacyThemes(SQL_PATH)
    console.log({
        parsedLines: parsed,
        skippedLines: skipped,
        slotsWithThemes: slugToThemes.size,
        uniqueTagsInSql: uniqueTags.size
    })

    const cmsByNorm = await loadCmsThemesByNorm()
    let resolvedTags = 0
    for (const sqlNorm of uniqueTags.keys()) {
        if (resolveSqlTagNorm(sqlNorm, cmsByNorm)) resolvedTags++
    }
    console.log({
        cmsThemes: cmsByNorm.size,
        sqlTagsResolved: resolvedTags,
        sqlTagsMissing: uniqueTags.size - resolvedTags
    })

    const permalinkToSlotIds = await loadPermalinkSlotIds()
    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0
    let tagsSkipped = 0

    for (const [slug, themeNorms] of slugToThemes.entries()) {
        const slotIds = permalinkToSlotIds.get(slug)
        if (!slotIds) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        for (const sqlNorm of themeNorms) {
            const entry = resolveSqlTagNorm(sqlNorm, cmsByNorm)
            if (!entry) {
                tagsSkipped++
                continue
            }
            relations.push({ post_id: slotIds, relative_id: entry.id })
        }
    }

    const existing = await knex('slot_theme_relative').select('post_id', 'relative_id')
    const existingSet = new Set(existing.map((r) => `${r.post_id}:${r.relative_id}`))
    const toInsert = relations.filter((r) => !existingSet.has(`${r.post_id}:${r.relative_id}`))

    const chunkSize = 500
    for (let i = 0; i < toInsert.length; i += chunkSize) {
        await knex('slot_theme_relative').insert(toInsert.slice(i, i + chunkSize))
    }

    const jokerEntry = resolveSqlTagNorm('joker', cmsByNorm)
    const jokerId = jokerEntry?.id
    let jokerLinks = 0
    if (jokerId) {
        const row = await knex('slot_theme_relative').where('relative_id', jokerId).count('* as c')
        jokerLinks = Number(row[0].c)
    }

    console.log({
        matchedSlugs,
        missingSlugs,
        tagLookupsSkipped: tagsSkipped,
        relationsBuilt: relations.length,
        relationsInserted: toInsert.length,
        relationsAlreadyExist: relations.length - toInsert.length,
        jokerThemeLinks: jokerLinks
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
