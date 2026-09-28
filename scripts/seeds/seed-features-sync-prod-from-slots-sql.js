const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const Helper = require('../../helpers')
const {
    parseLegacyFeatures,
    buildCmsLookups,
    resolveSqlTagNorm,
    normalizeTag,
    looseKey
} = require('./feature-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('features').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createFeatureRecord(title) {
    const permalink = await ensureUniquePermalink(Helper.transliterateUrl(title), 1)
    const baseRow = {
        status: 'public',
        permalink,
        title,
        thumbnail: _THUMBNAIL,
        short_desc: '',
        h1: `${title} slots`,
        meta_title: `Best ${title} Slots and Casino Games`,
        description: `Explore slots with ${title} feature.`,
        keywords: '',
        content: '',
        post_type: 'feature',
        slug: 'feature',
        parent_id: 0
    }

    const [parentId] = await knex('features').insert({ ...baseRow, lang: 1 })
    await knex('feature_meta').insert({ post_id: parentId, rating: 0 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('features').insert({
            ...baseRow,
            lang: langId,
            parent_id: parentId,
            status: 'hide',
            title
        })
        await knex('feature_meta').insert({ post_id: childId, rating: 0 })
    }

    return parentId
}

async function showFeatureTree(parentId, title) {
    await knex('features')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({
            status: 'public',
            title,
            h1: `${title} slots`,
            meta_title: `Best ${title} Slots and Casino Games`,
            updated_at: knex.fn.now()
        })
}

async function hideFeatureTree(parentId) {
    await knex('features')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({ status: 'hide', updated_at: knex.fn.now() })
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    const { uniqueTags } = await parseLegacyFeatures(SQL_PATH)
    const rows = await knex('features').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const lookups = buildCmsLookups(rows)

    const usedCmsIds = new Set()
    let created = 0
    let resolved = 0

    for (const [sqlNorm, displayTitle] of uniqueTags.entries()) {
        let entry = resolveSqlTagNorm(sqlNorm, lookups)
        if (entry) {
            await showFeatureTree(entry.id, entry.title)
            usedCmsIds.add(entry.id)
            resolved++
            continue
        }

        const id = await createFeatureRecord(displayTitle)
        entry = { id, title: displayTitle }
        lookups.byNorm.set(normalizeTag(displayTitle), entry)
        lookups.byLoose.set(looseKey(displayTitle), entry)
        usedCmsIds.add(id)
        created++
        resolved++
    }

    let hidden = 0
    for (const row of rows) {
        if (usedCmsIds.has(row.id)) continue
        await hideFeatureTree(row.id)
        hidden++
    }

    const publicCount = await knex('features')
        .where({ lang: 1, parent_id: 0, status: 'public' })
        .count('* as c')

    console.log({
        tagsInSlotsSql: uniqueTags.size,
        resolved,
        created,
        hidden,
        publicFeatures: Number(publicCount[0].c)
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
