const fs = require('fs')
const readline = require('readline')

const RE_SLUG = /'https:\/\/slotcatalog\.com\/en\/slots\/([^']+)'/
const RE_VOLATILITY =
    /^\(\d+,\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'((?:[^'\\]|\\.)*)',\s*'/

/** Как на проде — только эти в публичном списке */
const PROD_VOLATILITIES = [
    'Medium',
    'High',
    'Medium-High',
    'Low',
    'Low-Medium',
    'Adjusted',
    'Very High'
]

const VOLATILITY_ALIASES = {
    'very high': 'Very High',
    low: 'Low'
}

function parseQuoted(raw) {
    if (!raw || raw === 'NULL') return null
    return raw.replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim()
}

function normalizeVolatility(name) {
    return name.replace(/\s+/g, ' ').trim()
}

function canonicalVolatility(raw) {
    const norm = normalizeVolatility(raw)
    if (!norm) return null
    const key = norm.toLowerCase()
    if (VOLATILITY_ALIASES[key]) return VOLATILITY_ALIASES[key]
    const prod = PROD_VOLATILITIES.find((p) => p.toLowerCase() === key)
    return prod || norm
}

async function parseLegacyVolatility(filePath) {
    const slugToVolatility = new Map()
    const uniqueValues = new Map()
    let parsed = 0
    let skipped = 0

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    })

    for await (const line of rl) {
        if (!line.startsWith('(')) continue
        const slugMatch = line.match(RE_SLUG)
        const volMatch = line.match(RE_VOLATILITY)
        if (!slugMatch || !volMatch) {
            skipped++
            continue
        }
        parsed++
        const slug = slugMatch[1].toLowerCase()
        const raw = parseQuoted(volMatch[1])
        if (!raw) continue
        const canonical = canonicalVolatility(raw)
        uniqueValues.set(canonical, raw)
        if (!slugToVolatility.has(slug)) slugToVolatility.set(slug, canonical)
    }

    return { slugToVolatility, uniqueValues, parsed, skipped }
}

module.exports = {
    RE_SLUG,
    RE_VOLATILITY,
    PROD_VOLATILITIES,
    VOLATILITY_ALIASES,
    parseQuoted,
    normalizeVolatility,
    canonicalVolatility,
    parseLegacyVolatility
}
