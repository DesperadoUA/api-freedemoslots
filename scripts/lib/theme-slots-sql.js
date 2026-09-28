const fs = require('fs')
const readline = require('readline')

const RE_SLUG = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)'/
const RE_THEMES =
    /^\(\d+,\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'(?:\d|N)/

/** Тег из slots.sql (norm) → title в CMS (norm), если на проде другое имя */
const SQL_TAG_ALIASES = {
    classic: 'classic style',
    'card theme': 'card',
    'medieval & middle ages': 'medieval and middle ages',
    'war & military theme': 'war and military theme',
    'mythical & legend': 'mythical and legend',
    travelling: 'travelling and countries',
    'bugs & insects': 'bugs and insects',
    'tv & movies': 'tv and movies',
    'hell & inferno': 'hell and inferno',
    'tools & instruments': 'tools and instruments',
    'romance & love': 'romance and love',
    'gift & present': 'gift and present',
    'glamour & glance': 'glamour and glance',
    'hairdresser & barber': 'hairdresser and barber',
    'races & racing': 'races and racing',
    fruits: 'fruit',
    'bank theme': 'bank',
    'casino theme': 'casino',
    'prison theme': 'prison'
}

function parseQuoted(raw) {
    if (!raw || raw === 'NULL') return null
    return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim()
}

function normalizeTheme(name) {
    return name.replace(/\s+/g, ' ').trim().toLowerCase()
}

function parseThemeTags(raw) {
    const value = parseQuoted(raw)
    if (!value) return []
    return value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
}

function resolveSqlTagNorm(sqlNorm, cmsByNorm) {
    const cmsNorm = SQL_TAG_ALIASES[sqlNorm] || sqlNorm
    return cmsByNorm.get(cmsNorm) || null
}

async function parseLegacyThemes(filePath) {
    const slugToThemes = new Map()
    /** norm -> display title from sql */
    const uniqueTags = new Map()
    let parsed = 0
    let skipped = 0

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    })

    for await (const line of rl) {
        if (!line.startsWith('(')) continue
        const slugMatch = line.match(RE_SLUG)
        const themesMatch = line.match(RE_THEMES)
        if (!slugMatch || !themesMatch) {
            skipped++
            continue
        }
        parsed++
        const slug = slugMatch[1].toLowerCase()
        const tags = parseThemeTags(themesMatch[1])
        if (!tags.length) continue

        if (!slugToThemes.has(slug)) slugToThemes.set(slug, new Set())
        const set = slugToThemes.get(slug)
        for (const tag of tags) {
            const norm = normalizeTheme(tag)
            if (!uniqueTags.has(norm)) uniqueTags.set(norm, tag)
            set.add(norm)
        }
    }

    return { slugToThemes, uniqueTags, parsed, skipped }
}

module.exports = {
    RE_SLUG,
    RE_THEMES,
    SQL_TAG_ALIASES,
    parseQuoted,
    normalizeTheme,
    parseThemeTags,
    resolveSqlTagNorm,
    parseLegacyThemes
}
