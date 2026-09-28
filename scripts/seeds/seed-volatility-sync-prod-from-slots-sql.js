const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const Helper = require('../../helpers')
const {
    parseLegacyVolatility,
    PROD_VOLATILITIES,
    canonicalVolatility
} = require('./volatility-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('volatilities').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createVolatilityRecord(title) {
    const permalink = await ensureUniquePermalink(Helper.transliterateUrl(title), 1)
    const baseRow = {
        status: 'public',
        permalink,
        title,
        thumbnail: _THUMBNAIL,
        short_desc: '',
        h1: `${title} volatility slots`,
        meta_title: `Best ${title} Volatility Slots`,
        description: `Explore ${title} volatility slots and casino games.`,
        keywords: '',
        content: '',
        post_type: 'volatility',
        slug: 'volatility',
        parent_id: 0
    }

    const [parentId] = await knex('volatilities').insert({ ...baseRow, lang: 1 })
    await knex('volatility_meta').insert({ post_id: parentId, rating: 0 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('volatilities').insert({
            ...baseRow,
            lang: langId,
            parent_id: parentId
        })
        await knex('volatility_meta').insert({ post_id: childId, rating: 0 })
    }

    return parentId
}

async function hideVolatilityTree(parentId) {
    await knex('volatilities')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({ status: 'hide', updated_at: knex.fn.now() })
}

async function showVolatilityTree(parentId, title) {
    await knex('volatilities')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({
            status: 'public',
            title,
            h1: `${title} volatility slots`,
            meta_title: `Best ${title} Volatility Slots`,
            updated_at: knex.fn.now()
        })
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    const { uniqueValues } = await parseLegacyVolatility(SQL_PATH)
    const rows = await knex('volatilities').select('id', 'title', 'status').where({ lang: 1, parent_id: 0 })
    const byTitle = new Map(rows.map((r) => [r.title.toLowerCase(), r]))

    let created = 0
    for (const title of PROD_VOLATILITIES) {
        const key = title.toLowerCase()
        if (!byTitle.has(key)) {
            const id = await createVolatilityRecord(title)
            byTitle.set(key, { id, title, status: 'public' })
            created++
        } else {
            await showVolatilityTree(byTitle.get(key).id, title)
        }
    }

    const prodKeys = new Set(PROD_VOLATILITIES.map((t) => t.toLowerCase()))
    let hidden = 0
    for (const row of rows) {
        if (prodKeys.has(row.title.toLowerCase())) continue
        await hideVolatilityTree(row.id)
        hidden++
        console.log(`  hide: ${row.title}`)
    }

    const publicCount = await knex('volatilities')
        .where({ lang: 1, parent_id: 0, status: 'public' })
        .count('* as c')

    console.log({
        valuesInSlotsSql: uniqueValues.size,
        prodTypes: PROD_VOLATILITIES.length,
        created,
        hidden,
        publicVolatilities: Number(publicCount[0].c)
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
