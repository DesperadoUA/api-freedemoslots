const knex = require('../db')
class TranslateModelKnex {
    constructor(table) {
        this.table = table
    }
    async getRelativeByPostId(id) {
        const result = await knex(this.table).select().where({ post_id: id })
        return result.length ? result.map(item => item.relative_id) : []
    }
    async getPostIdByRelative(id) {
        const result = await knex(this.table).select().where({ relative_id: id })
        return result.length ? result.map(item => item.post_id) : []
    }
    async insert(postId, relativeId) {
        await knex(this.table).insert({post_id: postId, relative_id: relativeId})
    }
    async delete(id) {
        await knex(this.table).where({ post_id: id }).del()
    }
    async update(postId, relativeIds = []) {
        await this.delete(postId)
        for await (const id of relativeIds) {
            await this.insert(postId, id)
        }
    }
}
module.exports = TranslateModelKnex