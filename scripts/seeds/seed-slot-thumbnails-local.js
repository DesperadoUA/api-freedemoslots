require('../../config')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const knex = require('../../db')

const IMG_SLOTS_DIR = path.join(__dirname, '../../img/slots')
const CDN_BASE = 'https://api2.freedemoslots.net'
const CONCURRENCY = Number(process.env.CONCURRENCY || 8)
const LIMIT = process.argv.includes('--limit')
    ? Number(process.argv[process.argv.indexOf('--limit') + 1])
    : 0
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP_EXISTING = process.argv.includes('--skip-existing')
const API2_ONLY = !process.argv.includes('--all-hosts')

function downloadFile(url, dest) {
    const client = url.startsWith('https') ? https : http
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)
        const request = client.get(url, (res) => {
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

function normalizeThumbnailUrl(thumbnail) {
    if (!thumbnail || typeof thumbnail !== 'string') return null
    const trimmed = thumbnail.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    if (trimmed.startsWith('/')) return `${CDN_BASE}${trimmed}`
    return null
}

function extFromUrl(url) {
    try {
        const ext = path.extname(new URL(url).pathname).toLowerCase()
        if (['.webp', '.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            return ext === '.jpeg' ? '.jpg' : ext
        }
    } catch (_) {}
    return '.webp'
}

async function loadExternalThumbnailGroups() {
    const query = knex('slots')
        .whereNotNull('thumbnail')
        .where('thumbnail', '!=', '')
        .where((qb) => {
            qb.where('thumbnail', 'like', 'http%')
                .orWhere('thumbnail', 'like', '/%')
                .orWhere('thumbnail', 'like', '//%')
        })
        .whereNot('thumbnail', 'like', `${_API_URL}%`)

    if (API2_ONLY) {
        query.where('thumbnail', 'like', `${CDN_BASE}%`)
    }

    const rows = await query
        .select('id', 'thumbnail')
        .orderBy('id', 'asc')

    const byUrl = new Map()
    for (const row of rows) {
        const url = normalizeThumbnailUrl(row.thumbnail)
        if (!url) continue
        if (!byUrl.has(url)) {
            byUrl.set(url, { keepId: row.id, originals: new Set([row.thumbnail]) })
            continue
        }
        byUrl.get(url).originals.add(row.thumbnail)
    }
    return byUrl
}

async function runPool(items, worker) {
    let index = 0
    const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (index < items.length) {
            const current = index++
            await worker(items[current], current)
        }
    })
    await Promise.all(workers)
}

async function main() {
    if (!fs.existsSync(IMG_SLOTS_DIR)) fs.mkdirSync(IMG_SLOTS_DIR, { recursive: true })

    const byUrl = await loadExternalThumbnailGroups()
    let entries = [...byUrl.entries()].map(([url, meta]) => [url, meta])
    if (LIMIT > 0) entries = entries.slice(0, LIMIT)

    const report = {
        totalDistinct: byUrl.size,
        processed: entries.length,
        downloaded: 0,
        skippedExisting: 0,
        dbUpdated: 0,
        failed: []
    }

    console.log(`distinct external thumbnails: ${byUrl.size}, to process: ${entries.length}, dryRun: ${DRY_RUN}`)

    await runPool(entries, async ([remoteUrl, meta], idx) => {
        const { keepId, originals } = meta
        const ext = extFromUrl(remoteUrl)
        const fileName = `${keepId}${ext}`
        const filePath = path.join(IMG_SLOTS_DIR, fileName)
        const localUrl = `${_API_URL}/img/slots/${fileName}`
        const thumbKeys = [...new Set([...originals, remoteUrl])]

        if (SKIP_EXISTING && fs.existsSync(filePath)) {
            report.skippedExisting++
        } else if (!DRY_RUN) {
            try {
                await downloadFile(remoteUrl, filePath)
                report.downloaded++
            } catch (err) {
                report.failed.push({ keepId, remoteUrl, reason: err.message })
                return
            }
        }

        if (!DRY_RUN) {
            const updated = await knex('slots').whereIn('thumbnail', thumbKeys).update({
                thumbnail: localUrl,
                updated_at: knex.fn.now()
            })
            report.dbUpdated += Number(updated) || 0
        }

        if ((idx + 1) % 100 === 0 || idx + 1 === entries.length) {
            console.log(`progress ${idx + 1}/${entries.length}`)
        }
    })

    console.log(JSON.stringify(report, null, 2))
    await knex.destroy()
}

main().catch(async (err) => {
    console.error(err)
    await knex.destroy()
    process.exit(1)
})
