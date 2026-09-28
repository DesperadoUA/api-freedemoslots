const fs = require('fs')
const readline = require('readline')

const RE_SLUG = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)'/
const RE_FEATURES =
    /^\(\d+,\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'/

const SQL_TAG_ALIASES = {
    'bonus symbol': 'bonus symbols',
    'instant win games': 'instant win',
    'cascading reels': 'cascading',
    gamble: 'gamble feature',
    'feature substitution symbols': 'substitution symbols',
    bothway: 'both ways'
}

function parseQuoted(raw) {
    if (!raw || raw === 'NULL') return null
    return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim()
}

function normalizeTag(name) {
    return name.replace(/\s+/g, ' ').trim().toLowerCase().replace(/&/g, 'and')
}

function looseKey(name) {
    return normalizeTag(name).replace(/[^a-z0-9]/g, '')
}

function parseFeatureTags(raw) {
    const value = parseQuoted(raw)
    if (!value) return []
    return value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
}

function buildCmsLookups(rows) {
    const byNorm = new Map()
    const byLoose = new Map()
    for (const row of rows) {
        const entry = { id: row.id, title: row.title }
        byNorm.set(normalizeTag(row.title), entry)
        byLoose.set(looseKey(row.title), entry)
    }
    return { byNorm, byLoose }
}

function resolveSqlTagNorm(sqlNorm, { byNorm, byLoose }) {
    const aliasNorm = SQL_TAG_ALIASES[sqlNorm]
        ? normalizeTag(SQL_TAG_ALIASES[sqlNorm])
        : sqlNorm
    if (byNorm.has(aliasNorm)) return byNorm.get(aliasNorm)
    const loose = looseKey(aliasNorm)
    if (byLoose.has(loose)) return byLoose.get(loose)
    return null
}

async function parseLegacyFeatures(filePath) {
    const slugToFeatures = new Map()
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
        const featMatch = line.match(RE_FEATURES)
        if (!slugMatch || !featMatch) {
            skipped++
            continue
        }
        parsed++
        const slug = slugMatch[1].toLowerCase()
        const tags = parseFeatureTags(featMatch[1])
        if (!tags.length) continue

        if (!slugToFeatures.has(slug)) slugToFeatures.set(slug, new Set())
        const set = slugToFeatures.get(slug)
        for (const tag of tags) {
            const norm = normalizeTag(tag)
            uniqueTags.set(norm, tag)
            set.add(norm)
        }
    }

    return { slugToFeatures, uniqueTags, parsed, skipped }
}

module.exports = {
    RE_SLUG,
    RE_FEATURES,
    SQL_TAG_ALIASES,
    parseQuoted,
    normalizeTag,
    looseKey,
    parseFeatureTags,
    buildCmsLookups,
    resolveSqlTagNorm,
    parseLegacyFeatures
}
