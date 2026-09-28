require('../../config');
const knex = require('../../db');

const LANG_IDS = Object.keys(_LANG).map(Number);

const SETTINGS = [
    {
        key_id: 'header_menu',
        title: 'Header menu',
        editor: 'multiple_two_input',
        value: '[]',
    },
    {
        key_id: 'footer_menu',
        title: 'Footer menu',
        editor: 'multiple_two_input',
        value: '[]',
    },
    {
        key_id: 'footer_text',
        title: 'Footer Text',
        editor: 'input',
        value: '© 2026 DemoSlots',
    },
];

async function seed() {
    let inserted = 0;
    let skipped = 0;

    for (const lang of LANG_IDS) {
        for (const item of SETTINGS) {
            const exists = await knex('settings')
                .where({ key_id: item.key_id, lang })
                .first();

            if (exists) {
                skipped++;
                continue;
            }

            await knex('settings').insert({
                slug: 'settings',
                key_id: item.key_id,
                title: item.title,
                value: item.value,
                editor: item.editor,
                lang,
            });
            inserted++;
        }
    }

    console.log(`settings: inserted ${inserted}, skipped ${skipped}`);
}

seed()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => knex.destroy());
