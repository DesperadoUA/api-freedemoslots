require('../../config')
const knex = require('../../db')

const LANG_IDS = Object.keys(_LANG).map(Number)
const PERMALINK = 'live-casino-games'

async function seed() {
    const exists = await knex('pages').where({ permalink: PERMALINK, lang: 1, parent_id: 0 }).first()
    if (exists) {
        console.log(`Page ${PERMALINK} already exists (id ${exists.id})`)
        return
    }

    const baseRow = {
        status: 'public',
        permalink: PERMALINK,
        title: 'Live casino games',
        thumbnail: _THUMBNAIL,
        short_desc: 'Live casino games',
        h1: 'Live Casino Games',
        meta_title: 'Live Casino Games — Roulette, Blackjack, Baccarat & Game Shows',
        description: 'Browse live casino game categories and play free demo slots.',
        keywords: '',
        content: '',
        post_type: 'page',
        parent_id: 0
    }

    const [parentId] = await knex('pages').insert({ ...baseRow, lang: 1 })

    for (const langId of LANG_IDS) {
        if (langId === 1) continue
        await knex('pages').insert({
            ...baseRow,
            lang: langId,
            parent_id: parentId,
            status: 'hide',
            title: `Live casino games lang ${langId}`
        })
    }

    console.log(`Created page ${PERMALINK}, parent id ${parentId}`)
}

seed()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => knex.destroy())
