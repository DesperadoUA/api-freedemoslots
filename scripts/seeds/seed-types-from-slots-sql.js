require('../../config')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const knex = require('../../db')
const Helper = require('../../helpers')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)
const CANONICAL_SLOTS = 'Slots'

const ALLOWED_TYPES = [
    'Slots',
    'Dice',
    'Crash Games',
    'Scratch Cards',
    'Roulette',
    'Blackjack',
    'Plinko',
    'Bingo',
    'Special Games',
    'Video Poker',
    'Instant Win Games',
    'Mines',
    'Keno',
    'Baccarat',
    'Poker',
    'Shooting Game',
    'Card Games',
    'Arcade'
]

const ALLOWED_SET = new Set(ALLOWED_TYPES)

const TYPE_ALIASES = {
    'Video Slots': CANONICAL_SLOTS
}

function normalizeTitle(name) {
    return name.replace(/\s+/g, ' ').trim()
}

function resolveGameType(raw) {
    const norm = normalizeTitle(raw)
    return TYPE_ALIASES[norm] || norm
}

function isValidGameType(value) {
    if (!value) return false
    const norm = normalizeTitle(value)
    if (!norm || norm.length > 80) return false
    if (/https?:\/\//i.test(norm)) return false
    if (norm.includes(',')) return false
    if (norm === 'Unknown') return false
    return ALLOWED_SET.has(resolveGameType(norm))
}

async function deleteTypeTree(parentId) {
    const children = await knex('types').where({ parent_id: parentId }).select('id')
    const childIds = children.map(r => r.id)
    const allIds = [parentId, ...childIds]

    await knex('slot_type_relative').whereIn('relative_id', allIds).del()
    await knex('type_meta').whereIn('post_id', allIds).del()
    if (childIds.length) await knex('types').whereIn('id', childIds).del()
    await knex('types').where({ id: parentId }).del()
}

async function removeDisallowedTypes() {
    const rows = await knex('types').select('id', 'title').where({ lang: 1, parent_id: 0 })
    let removed = 0
    for (const row of rows) {
        if (!ALLOWED_SET.has(normalizeTitle(row.title))) {
            await deleteTypeTree(row.id)
            removed++
            console.log(`Removed type: ${row.title}`)
        }
    }
    return removed
}

async function ensureAllLangChildren(parentId) {
    const parent = await knex('types').where({ id: parentId }).first()
    if (!parent) return 0

    const existing = await knex('types').where({ parent_id: parentId }).select('lang')
    const existingLangs = new Set(existing.map(r => r.lang))
    let created = 0

    const baseRow = {
        status: parent.status,
        permalink: parent.permalink,
        title: parent.title,
        thumbnail: parent.thumbnail,
        short_desc: parent.short_desc,
        h1: parent.h1,
        meta_title: parent.meta_title,
        description: parent.description,
        keywords: parent.keywords,
        content: parent.content,
        post_type: parent.post_type,
        slug: parent.slug,
        parent_id: parentId
    }

    for (const langId of LANG_IDS) {
        if (langId === 1 || existingLangs.has(langId)) continue
        const [childId] = await knex('types').insert({ ...baseRow, lang: langId })
        await knex('type_meta').insert({ post_id: childId, text: '' })
        created++
    }

    return created
}

async function migrateVideoSlotsToSlots() {
    const videoRow = await knex('types').where({ lang: 1, parent_id: 0, title: 'Video Slots' }).first()
    const slotsRow = await knex('types').where({ lang: 1, parent_id: 0, title: CANONICAL_SLOTS }).first()

    if (videoRow && slotsRow && videoRow.id !== slotsRow.id) {
        await knex('slot_type_relative').where({ relative_id: videoRow.id }).update({ relative_id: slotsRow.id })
        await deleteTypeTree(videoRow.id)
    }

    const main = videoRow && !slotsRow ? videoRow : slotsRow
    if (!main && !videoRow) return null

    const target = main || videoRow
    const permalink = 'slots'
    await knex('types').where({ id: target.id }).update({
        title: CANONICAL_SLOTS,
        permalink,
        h1: CANONICAL_SLOTS,
        meta_title: CANONICAL_SLOTS
    })
    const children = await knex('types').where({ parent_id: target.id })
    for (const child of children) {
        await knex('types').where({ id: child.id }).update({ title: CANONICAL_SLOTS, permalink })
    }
    if (videoRow && !slotsRow) console.log(`Renamed Video Slots → ${CANONICAL_SLOTS}`)
    return target.id
}

async function parseLegacyGameTypes(filePath) {
    const slugToType = new Map()
    const typeCounts = new Map()

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    })

    const urlRe = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)',\s*'([^']*)',\s*(NULL|'(?:[^'\\]|\\.)*')/g

    for await (const line of rl) {
        if (!line.includes('slotcatalog.com/en/slots/')) continue

        let m
        while ((m = urlRe.exec(line)) !== null) {
            const slug = m[1].toLowerCase()
            let gameType = null

            if (/Shooting game/i.test(line)) {
                gameType = 'Shooting Game'
            } else {
                const rawType = m[2]
                if (!isValidGameType(rawType)) continue
                gameType = resolveGameType(rawType)
            }

            if (!ALLOWED_SET.has(gameType)) continue

            slugToType.set(slug, gameType)
            typeCounts.set(gameType, (typeCounts.get(gameType) || 0) + 1)
        }
    }

    return { slugToType, typeCounts }
}

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('types').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createTypeRecord(title) {
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
        post_type: 'type',
        slug: 'type',
        parent_id: 0
    }

    const [parentId] = await knex('types').insert({ ...baseRow, lang: 1 })
    await knex('type_meta').insert({ post_id: parentId, text: '' })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('types').insert({ ...baseRow, lang: langId, parent_id: parentId })
        await knex('type_meta').insert({ post_id: childId, text: '' })
    }

    return parentId
}

async function loadTypesByTitle() {
    const rows = await knex('types').select('id', 'title').where({ lang: 1, parent_id: 0 })
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

    const removed = await removeDisallowedTypes()
    const slotsId = await migrateVideoSlotsToSlots()
    if (slotsId) {
        const langCopies = await ensureAllLangChildren(slotsId)
        if (langCopies) console.log(`Slots: added ${langCopies} missing lang copies`)
    }

    const typesByTitle = await loadTypesByTitle()
    if (slotsId) typesByTitle.set(CANONICAL_SLOTS, slotsId)

    let typesCreated = 0
    let langCopiesAdded = 0
    for (const title of ALLOWED_TYPES) {
        if (!typesByTitle.has(title)) {
            const id = await createTypeRecord(title)
            typesByTitle.set(title, id)
            typesCreated++
            continue
        }
        langCopiesAdded += await ensureAllLangChildren(typesByTitle.get(title))
    }
    console.log(`Removed ${removed} extra types, created ${typesCreated} types, added ${langCopiesAdded} lang copies`)

    console.log(`Parsing ${SQL_PATH}...`)
    const { slugToType, typeCounts } = await parseLegacyGameTypes(SQL_PATH)
    console.log('Slots per type in dump:', [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', '))

    const permalinkToSlotIds = await loadPermalinkSlotIds()
    const allowedTypeIds = new Set(ALLOWED_TYPES.map(t => typesByTitle.get(t)).filter(Boolean))

    await knex('slot_type_relative').whereNotIn('relative_id', [...allowedTypeIds]).del()
    const deletedAll = await knex('slot_type_relative').del()
    console.log(`Cleared slot_type_relative: ${deletedAll} rows`)

    const relations = []
    let matchedSlugs = 0
    let missingSlugs = 0

    for (const [slug, typeTitle] of slugToType.entries()) {
        const slotId = permalinkToSlotIds.get(slug)
        if (!slotId) {
            missingSlugs++
            continue
        }
        matchedSlugs++
        const typeId = typesByTitle.get(typeTitle)
        if (!typeId) continue
        relations.push({ post_id: slotId, relative_id: typeId })
    }

    const chunkSize = 500
    for (let i = 0; i < relations.length; i += chunkSize) {
        await knex('slot_type_relative').insert(relations.slice(i, i + chunkSize))
    }

    const finalTypes = await knex('types').where({ lang: 1, parent_id: 0 }).select('title').orderBy('title')
    const relCount = await knex('slot_type_relative').count('* as c')

    console.log({
        typesInDb: finalTypes.length,
        types: finalTypes.map(r => r.title),
        matchedSlugs,
        missingSlugs,
        relationsInserted: relations.length,
        totalRelations: relCount[0].c
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
