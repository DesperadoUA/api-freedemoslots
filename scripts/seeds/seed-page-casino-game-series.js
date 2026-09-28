require('../../config')
const knex = require('../../db')

const LANG_IDS = Object.keys(_LANG).map(Number)
const PERMALINK = 'casino-game-series'

async function seed() {
    const exists = await knex('pages').where({ permalink: PERMALINK, lang: 1, parent_id: 0 }).first()
    if (exists) {
        console.log(`Page ${PERMALINK} already exists (id ${exists.id})`)
        return
    }

    const baseRow = {
        status: 'public',
        permalink: PERMALINK,
        title: 'Casino game series',
        thumbnail: _THUMBNAIL,
        short_desc: 'Casino game series',
        h1: 'Casino Game Series',
        meta_title: 'Casino Game Series — Slot Series Directory',
        description: 'Browse casino slot series and play demo games.',
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
            title: `Casino game series lang ${langId}`
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
