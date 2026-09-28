const path = require('path')
require('../../config')
const fs = require('fs')
const knex = require('../../db')
const Helper = require('../../helpers')
const {
    normalizeTheme,
    parseLegacyThemes,
    resolveSqlTagNorm,
    SQL_TAG_ALIASES
} = require('./theme-slots-sql')

const SQL_PATH = process.argv[2] || path.join(__dirname, '../data/slots.sql')
const LANG_IDS = Object.keys(_LANG).map(Number)

async function ensureUniquePermalink(permalink, lang) {
    let candidate = permalink
    let counter = 0
    while (await knex('themes').where({ permalink: candidate, lang }).first()) {
        counter++
        candidate = `${permalink}-${counter}`
    }
    return candidate
}

async function createThemeRecord(title) {
    const permalink = await ensureUniquePermalink(Helper.transliterateUrl(title), 1)
    const baseRow = {
        status: 'public',
        permalink,
        title,
        thumbnail: _THUMBNAIL,
        short_desc: '',
        h1: `${title} slots`,
        meta_title: `Best ${title} Themed Slots & Casino Games`,
        description: `Discover the best ${title} slots and casino games.`,
        keywords: '',
        content: '',
        post_type: 'theme',
        slug: 'theme',
        parent_id: 0
    }

    const [parentId] = await knex('themes').insert({ ...baseRow, lang: 1 })
    await knex('theme_meta').insert({ post_id: parentId, rating: 0 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        const [childId] = await knex('themes').insert({
            ...baseRow,
            lang: langId,
            parent_id: parentId
        })
        await knex('theme_meta').insert({ post_id: childId, rating: 0 })
    }

    return parentId
}

async function hideThemeTree(parentId) {
    await knex('themes')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({ status: 'hide', updated_at: knex.fn.now() })
}

async function loadThemesByNorm() {
    const rows = await knex('themes').select('id', 'title').where({ lang: 1, parent_id: 0 })
    const map = new Map()
    for (const row of rows) {
        map.set(normalizeTheme(row.title), { id: row.id, title: row.title })
    }
    return map
}

async function seed() {
    if (!fs.existsSync(SQL_PATH)) {
        throw new Error(`File not found: ${SQL_PATH}`)
    }

    const { uniqueTags } = await parseLegacyThemes(SQL_PATH)
    const cmsByNorm = await loadThemesByNorm()

    const usedCmsNorms = new Set()
    let created = 0
    let aliased = 0

    for (const [sqlNorm, displayTitle] of uniqueTags.entries()) {
        let entry = resolveSqlTagNorm(sqlNorm, cmsByNorm)
        if (entry) {
            if (SQL_TAG_ALIASES[sqlNorm]) aliased++
            usedCmsNorms.add(normalizeTheme(entry.title))
            continue
        }

        const id = await createThemeRecord(displayTitle)
        entry = { id, title: displayTitle }
        cmsByNorm.set(normalizeTheme(displayTitle), entry)
        usedCmsNorms.add(normalizeTheme(displayTitle))
        created++
    }

    let hidden = 0
    for (const [cmsNorm, { id, title }] of cmsByNorm.entries()) {
        if (usedCmsNorms.has(cmsNorm)) continue
        await hideThemeTree(id)
        hidden++
        console.log(`  hide: ${title}`)
    }

    const publicParents = await knex('themes')
        .where({ lang: 1, parent_id: 0, status: 'public' })
        .count('* as c')

    console.log({
        tagsInSlotsSql: uniqueTags.size,
        themesCreated: created,
        tagsViaAlias: aliased,
        themesHidden: hidden,
        publicParentThemesNow: Number(publicParents[0].c)
    })
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
