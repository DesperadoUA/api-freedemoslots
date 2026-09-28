require('../../config')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const knex = require('../../db')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')

/** slug из url + best (0/1) после game_type и series */
const ROW_RE =
    /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)',\s*(?:NULL|'(?:[^'\\]|\\.)*'),\s*(?:NULL|'(?:[^'\\]|\\.)*'),\s*(\d+)/g

async function parseBestBySlug(filePath) {
    const map = new Map()
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity,
    })

    for await (const line of rl) {
        if (!line.includes('slotcatalog.com/en/slots/')) continue
        let m
        while ((m = ROW_RE.exec(line)) !== null) {
            const slug = m[1].toLowerCase()
            const best = Number(m[2]) ? 1 : 0
            if (!map.has(slug)) map.set(slug, best)
        }
    }

    return map
}

async function loadCmsSlotsByPermalink() {
    const rows = await knex('slots').select('id', 'permalink').where({ lang: 1 })
    const map = new Map()
    for (const row of rows) {
        const key = String(row.permalink || '').toLowerCase()
        if (key) map.set(key, row.id)
    }
    return map
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    console.log(`Parsing ${SQL_PATH}...`)
    const bestBySlug = await parseBestBySlug(SQL_PATH)
    console.log(`Legacy rows with url: ${bestBySlug.size}`)
    console.log(`Legacy best=1: ${[...bestBySlug.values()].filter((v) => v === 1).length}`)

    const cmsByPermalink = await loadCmsSlotsByPermalink()
    let updated = 0
    let insertedMeta = 0
    let missingSlot = 0

    for (const [slug, best] of bestBySlug.entries()) {
        const postId = cmsByPermalink.get(slug)
        if (!postId) {
            missingSlot++
            continue
        }

        const meta = await knex('slot_meta').where({ post_id: postId }).first()
        if (meta) {
            await knex('slot_meta').where({ post_id: postId }).update({ best })
            updated++
        } else {
            await knex('slot_meta').insert({
                post_id: postId,
                best,
                demo: '',
                faq: '[]',
                faq_title: '',
                release_date: '',
                rtp: '',
                paylines: '',
                reels: '',
                layout: '',
                min_bet: '',
                max_bet: '',
                max_win: '',
            })
            insertedMeta++
        }
    }

    console.log({
        cmsSlots: cmsByPermalink.size,
        updated,
        insertedMeta,
        missingSlot,
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
