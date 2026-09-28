const knex = require('../db')
class RelativeModelKnex {
    constructor(schema) {
        this.schema = schema
    }
    async getRelativeByPostId(id, relativeType) {
        const table = this.schema.relatives[relativeType].tableName
        const result = await knex(table).select().where({ post_id: id })
        return result.length ? result.map(item => item.relative_id) : []
    }
    async getPostIdByRelative(id, relativeType) {
        const table = this.schema.relatives[relativeType].tableName
        const result = await knex(table).select().where({ relative_id: id })
        return result.length ? result.map(item => item.post_id) : []
    }
    async insert(postId, relativeType, relativeId) {
        const table = this.schema.relatives[relativeType].tableName
        await knex(table).insert({post_id: postId, relative_id: relativeId})
    }
    async delete(id, relativeType) {
        const table = this.schema.relatives[relativeType].tableName
        await knex(table).where({ post_id: id }).del()
    }
    async update(postId, relativeType, relativeIds = []) {
        const table = this.schema.relatives[relativeType].tableName
        await knex(table).where({ post_id: postId }).del()
        if (!relativeIds.length) return
        await knex(table).insert(
            relativeIds.map((relativeId) => ({ post_id: postId, relative_id: relativeId }))
        )
    }
    /** Счётчик публичных слотов по id публичных провайдеров (для главной) */
    async countPublicSlotsByVendorIds(vendorIds, lang = 1) {
        if (!vendorIds?.length || !this.schema.relatives?.slot_vendor_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_vendor_relative.tableName
        const rows = await knex(`${table} as svr`)
            .join('slots as s', 's.id', 'svr.post_id')
            .whereIn('svr.relative_id', vendorIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .groupBy('svr.relative_id')
            .select('svr.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(vendorIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id тем */
    async countPublicSlotsByThemeIds(themeIds, lang = 1) {
        if (!themeIds?.length || !this.schema.relatives?.slot_theme_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_theme_relative.tableName
        const rows = await knex(`${table} as str`)
            .join('slots as s', 's.id', 'str.post_id')
            .whereIn('str.relative_id', themeIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as svr')
                    .join('vendors as v', function () {
                        this.on('v.id', 'svr.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('svr.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('str.relative_id')
            .select('str.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(themeIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id волатильности */
    async countPublicSlotsByVolatilityIds(volatilityIds, lang = 1) {
        if (!volatilityIds?.length || !this.schema.relatives?.slot_volatility_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_volatility_relative.tableName
        const rows = await knex(`${table} as svr`)
            .join('slots as s', 's.id', 'svr.post_id')
            .whereIn('svr.relative_id', volatilityIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as sv')
                    .join('vendors as v', function () {
                        this.on('v.id', 'sv.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('sv.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('svr.relative_id')
            .select('svr.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(volatilityIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id типа игры */
    async countPublicSlotsByTypeIds(typeIds, lang = 1) {
        if (!typeIds?.length || !this.schema.relatives?.slot_type_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_type_relative.tableName
        const rows = await knex(`${table} as str`)
            .join('slots as s', 's.id', 'str.post_id')
            .whereIn('str.relative_id', typeIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as sv')
                    .join('vendors as v', function () {
                        this.on('v.id', 'sv.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('sv.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('str.relative_id')
            .select('str.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(typeIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id фичи */
    async countPublicSlotsByFeatureIds(featureIds, lang = 1) {
        if (!featureIds?.length || !this.schema.relatives?.slot_feature_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_feature_relative.tableName
        const rows = await knex(`${table} as sfr`)
            .join('slots as s', 's.id', 'sfr.post_id')
            .whereIn('sfr.relative_id', featureIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as sv')
                    .join('vendors as v', function () {
                        this.on('v.id', 'sv.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('sv.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('sfr.relative_id')
            .select('sfr.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(featureIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id серии */
    async countPublicSlotsBySeriesIds(seriesIds, lang = 1) {
        if (!seriesIds?.length || !this.schema.relatives?.slot_series_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_series_relative.tableName
        const rows = await knex(`${table} as ssr`)
            .join('slots as s', 's.id', 'ssr.post_id')
            .whereIn('ssr.relative_id', seriesIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as sv')
                    .join('vendors as v', function () {
                        this.on('v.id', 'sv.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('sv.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('ssr.relative_id')
            .select('ssr.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(seriesIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }

    /** Публичные слоты с публичным провайдером по id live casino */
    async countPublicSlotsByLiveCasinoIds(liveCasinoIds, lang = 1) {
        if (!liveCasinoIds?.length || !this.schema.relatives?.slot_live_casino_relative) {
            return new Map()
        }
        const table = this.schema.relatives.slot_live_casino_relative.tableName
        const rows = await knex(`${table} as slcr`)
            .join('slots as s', 's.id', 'slcr.post_id')
            .whereIn('slcr.relative_id', liveCasinoIds)
            .where({ 's.status': 'public', 's.lang': lang })
            .whereExists(function () {
                this.select(knex.raw('1'))
                    .from('slot_vendor_relative as sv')
                    .join('vendors as v', function () {
                        this.on('v.id', 'sv.relative_id').andOn('v.lang', knex.raw('?', [lang]))
                    })
                    .whereRaw('sv.post_id = s.id')
                    .where({ 'v.status': 'public' })
            })
            .groupBy('slcr.relative_id')
            .select('slcr.relative_id')
            .count({ slotCounter: 's.id' })

        const map = new Map(liveCasinoIds.map((id) => [id, 0]))
        for (const row of rows) {
            map.set(row.relative_id, Number(row.slotCounter) || 0)
        }
        return map
    }
}
module.exports = RelativeModelKnex