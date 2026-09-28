require('../../config')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const knex = require('../../db')
const Helper = require('../../helpers')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)

function parseSeriesValue(raw) {
    if (!raw || raw === 'NULL') return null
    const m = raw.match(/^'((?:[^'\\]|\\.)*)'$/)
    if (!m) return null
    return m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim()
}

function normalizeSeries(name) {
    return name.replace(/\s+/g, ' ').trim()
}

async function parseLegacySeries(filePath) {
    const slugToSeries = new Map()
    const uniqueSeries = new Map()

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    })
    const re = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)',\s*'([^']*)',\s*(NULL|'(?:[^'\\]|\\.)*')/g

    for await (const line of rl) {
        let m
        while ((m = re.exec(line)) !== null) {
            const slug = m[1].toLowerCase()
            const series = parseSeriesValue(m[3])
            if (!series) continue
            const norm = normalizeSeries(series)
            if (!norm) continue
            uniqueSeries.set(norm, norm)
            if (!slugToSeries.has(slug)) slugToSeries.set(slug, norm)
        }
    }

    return { slugToSeries, uniqueSeries }
}

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('series').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createSeriesRecord(title) {
    const permalink = await ensureUniquePermalink(Helper.transliterateUrl(title), 1)

    const baseRow = {
        status: 'hide',
        permalink,
        title,
        thumbnail: _THUMBNAIL,
        short_desc: '',
        h1: `${title} slots`,
        meta_title: `Best ${title} Slots and Casino Games`,
        description: `Explore online slots and casino games from the ${title} series.`,
        keywords: '',
        content: '',
        post_type: 'series',
        slug: 'series',
        parent_id: 0
    }

    const [parentId] = await knex('series').insert({ ...baseRow, lang: 1 })
    await knex('series_meta').insert({ post_id: parentId, rating: 0 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('series').insert({
            ...baseRow,
            lang: langId,
            parent_id: parentId
        })
        await knex('series_meta').insert({ post_id: childId, rating: 0 })
    }

    return parentId
}

async function loadSeriesByTitle() {
    const rows = await knex('series').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const map = new Map()
    for (const row of rows) {
        map.set(normalizeSeries(row.title), row.id)
    }
    return map
}

async function loadPermalinkSlotIds() {
    const rows = await knex('slots').select('id', 'permalink')
    const map = new Map()
    for (const row of rows) {
        const key = String(row.permalink || '').toLowerCase()
        if (!key) continue
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(row.id)
    }
    return map
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    console.log(`Parsing ${SQL_PATH}...`)
    const { slugToSeries, uniqueSeries } = await parseLegacySeries(SQL_PATH)
    console.log(`Legacy: ${uniqueSeries.size} unique series, ${slugToSeries.size} slots with series`)

    const seriesByTitle = await loadSeriesByTitle()
    let seriesCreated = 0

    for (const title of uniqueSeries.keys()) {
        if (seriesByTitle.has(title)) continue
        const id = await createSeriesRecord(title)
        seriesByTitle.set(title, id)
        seriesCreated++
    }
    console.log(`Series created: ${seriesCreated}, total in map: ${seriesByTitle.size}`)

    const permalinkToSlotIds = await loadPermalinkSlotIds()
    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0

    for (const [slug, seriesTitle] of slugToSeries.entries()) {
        const slotIds = permalinkToSlotIds.get(slug)
        if (!slotIds?.length) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        const seriesId = seriesByTitle.get(seriesTitle)
        if (!seriesId) continue
        for (const postId of slotIds) {
            relations.push({ post_id: postId, relative_id: seriesId })
        }
    }

    const existing = await knex('slot_series_relative').select('post_id', 'relative_id')
    const existingSet = new Set(existing.map(r => `${r.post_id}:${r.relative_id}`))
    const toInsert = relations.filter(r => !existingSet.has(`${r.post_id}:${r.relative_id}`))

    const chunkSize = 500
    for (let i = 0; i < toInsert.length; i += chunkSize) {
        await knex('slot_series_relative').insert(toInsert.slice(i, i + chunkSize))
    }

    console.log({
        matchedSlugs,
        missingSlugs,
        relationsInserted: toInsert.length,
        relationsSkipped: relations.length - toInsert.length
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
