require('../../config')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const knex = require('../../db')
const Helper = require('../../helpers')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)

const LIVE_TYPES = [
    'Game Shows',
    'Live Baccarat',
    'Live Roulette',
    'Live Blackjack'
]

const LIVE_TYPE_SET = new Set(LIVE_TYPES)

function normalizeTitle(name) {
    return name.replace(/\s+/g, ' ').trim()
}

async function parseLegacyLiveTypes(filePath) {
    const slugToType = new Map()
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    })
    const re = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)',\s*'([^']*)',\s*(NULL|'(?:[^'\\]|\\.)*')/g

    for await (const line of rl) {
        if (!line.includes('slotcatalog.com/en/slots/')) continue
        let m
        while ((m = re.exec(line)) !== null) {
            const slug = m[1].toLowerCase()
            const gameType = normalizeTitle(m[2])
            if (!LIVE_TYPE_SET.has(gameType)) continue
            if (!slugToType.has(slug)) slugToType.set(slug, gameType)
        }
    }

    return slugToType
}

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('live_casino').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createLiveRecord(title) {
    const permalink = await ensureUniquePermalink(Helper.transliterateUrl(title), 1)
    const baseRow = {
        status: 'public',
        permalink,
        title,
        thumbnail: _THUMBNAIL,
        short_desc: '',
        h1: title,
        meta_title: title,
        description: '',
        keywords: '',
        content: '',
        post_type: 'live_casino',
        slug: 'live_casino',
        parent_id: 0
    }

    const [parentId] = await knex('live_casino').insert({ ...baseRow, lang: 1 })
    await knex('live_casino_meta').insert({ post_id: parentId, rating: 0 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('live_casino').insert({
            ...baseRow,
            status: 'hide',
            lang: langId,
            parent_id: parentId
        })
        await knex('live_casino_meta').insert({ post_id: childId, rating: 0 })
    }

    return parentId
}

async function loadLiveByTitle() {
    const rows = await knex('live_casino').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const map = new Map()
    for (const row of rows) {
        map.set(normalizeTitle(row.title), row.id)
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

    console.log(`Parsing ${SQL_PATH}...`)
    const slugToType = await parseLegacyLiveTypes(SQL_PATH)
    console.log(`Legacy: ${slugToType.size} slots with live game_type`)

    const liveByTitle = await loadLiveByTitle()
    let created = 0

    for (const title of LIVE_TYPES) {
        if (liveByTitle.has(title)) continue
        const id = await createLiveRecord(title)
        liveByTitle.set(title, id)
        created++
    }
    console.log(`Live categories created: ${created}, total: ${liveByTitle.size}`)

    await knex('live_casino').where({ lang: 1, parent_id: 0 }).update({ status: 'public' })

    const permalinkToSlotIds = await loadPermalinkSlotIds()
    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0

    for (const [slug, liveTitle] of slugToType.entries()) {
        const slotId = permalinkToSlotIds.get(slug)
        if (!slotId) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        const liveId = liveByTitle.get(liveTitle)
        if (!liveId) continue
        relations.push({ post_id: slotId, relative_id: liveId })
    }

    await knex('slot_live_casino_relative').del()

    const chunkSize = 500
    for (let i = 0; i < relations.length; i += chunkSize) {
        await knex('slot_live_casino_relative').insert(relations.slice(i, i + chunkSize))
    }

    console.log({
        matchedSlugs,
        missingSlugs,
        relationsInserted: relations.length
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
