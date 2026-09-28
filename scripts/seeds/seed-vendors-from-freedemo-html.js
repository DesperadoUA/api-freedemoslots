require('../../config')
const fs = require('fs')
const path = require('path')
const https = require('https')
const knex = require('../../db')

/** Slugs from freedemoslots providers carousel HTML */
const ALLOWED_SLUGS = [
    'ka-gaming', 'pragmatic-play', 'blueprint', 'games-global', 'igt', 'evoplay',
    'stakelogic', 'bgaming', 'booming-games', 'hacksaw-gaming', 'wazdan', 'isoftbet',
    'endorphina', 'tada-gaming', 'ruby-play', 'pg-soft', 'platipus', 'mascot-gaming',
    'playson', 'yggdrasil', '1spin4win', '3-oaks', 'spadegaming', 'nolimit-city',
    'netgame-entertainment', 'elk-studios', 'octoplay', '7777-gaming', 'bf-games',
    'reel-kingdom', 'gaming-corps', 'amigo-gaming', 'red-rake', 'genii', 'dragon-gaming',
    'barbara-bang', 'thunderkick', 'fils-game', 'zeusplay', 'avatarux-studios', 'air-dice',
    'popiplay', 'spinoro', 'gametimetech', 'yellow-bat', 'inout-games', 'atomic-slot-lab',
    'gamzix', 'pixmove-games', 'gamebeat', 'slotmill', 'zillion-games', 'indigo-magic',
    'peter-and-sons', 'playbro', 'spearhead-studios', 'world-match', 'fortune-factory-studios',
    'urgent-games', 'bigpot-gaming', 'galaxsys', 'ftg', 'astriona-games', 'crazy-tooth-studio',
    'infinity-dragon-studios', 'bullshark-games', 'dynabit-gaming', 'heronbyte', 'upgaming',
    'armadillo-studios', 'riddec-games', 'espresso-games', 'million-games', 'spin2win',
    'bellot', 'sa-gaming', 'ethereal-gaming', 'slammer-studios', 'bragg-gaming', 'edge-labs',
    'sportslots', 'xin-gaming'
]

const LOGO_CDN = 'https://api2.freedemoslots.net/providers-logo'
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads')

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)
        const request = https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close()
                fs.unlinkSync(dest)
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
            }
            if (res.statusCode !== 200) {
                file.close()
                fs.unlink(dest, () => {})
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
            }
            res.pipe(file)
            file.on('finish', () => file.close(() => resolve(dest)))
        })
        request.on('error', (err) => {
            file.close()
            fs.unlink(dest, () => {})
            reject(err)
        })
    })
}

async function updateVendorTree(parentId, patch) {
    await knex('vendors')
        .where({ id: parentId })
        .orWhere({ parent_id: parentId })
        .update({ ...patch, updated_at: knex.fn.now() })
}

async function main() {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

    const parents = await knex('vendors').where({ parent_id: 0, lang: 1 }).select('id', 'permalink', 'title')
    const slugSet = new Set(ALLOWED_SLUGS)
    const byPermalink = new Map(parents.map((p) => [p.permalink, p]))

    const matchedParentIds = new Set()
    const report = { public: [], hidden: [], downloadFailed: [], notInHtml: [] }

    for (const slug of ALLOWED_SLUGS) {
        const vendor = byPermalink.get(slug)
        if (!vendor) {
            report.downloadFailed.push({ slug, reason: 'no vendor in DB' })
            continue
        }

        const fileName = `vendor-${slug}.webp`
        const filePath = path.join(UPLOADS_DIR, fileName)
        const logoUrl = `${LOGO_CDN}/${slug}.webp`
        const localUrl = `${_API_URL}/uploads/${fileName}`

        try {
            await downloadFile(logoUrl, filePath)
        } catch (err) {
            report.downloadFailed.push({ slug, reason: err.message })
            continue
        }

        await updateVendorTree(vendor.id, { status: 'public', thumbnail: localUrl })
        matchedParentIds.add(vendor.id)
        report.public.push({ slug, id: vendor.id, thumbnail: localUrl })
    }

    for (const vendor of parents) {
        if (slugSet.has(vendor.permalink)) continue
        await updateVendorTree(vendor.id, { status: 'hide' })
        report.hidden.push({ permalink: vendor.permalink, title: vendor.title, id: vendor.id })
    }

    console.log(JSON.stringify({
        allowedSlugs: ALLOWED_SLUGS.length,
        published: report.public.length,
        hidden: report.hidden.length,
        downloadFailed: report.downloadFailed
    }, null, 2))

    await knex.destroy()
}

main().catch(async (err) => {
    console.error(err)
    await knex.destroy()
    process.exit(1)
})
