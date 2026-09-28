const SettingsModelKnex = require('@/models/SettingsKnex')
const CardBuilder = require('@/app/settings/CardBuilder')
const mainSchema = require('@/schemas/settings')
class Service {
    constructor() {
        this.schema = mainSchema;
    }
    async getPosts(lang) {
        const optionsModel = new SettingsModelKnex(this.schema);
        const posts = await optionsModel.getPosts(lang);
        return CardBuilder.mainCard(posts);
    }
    async indexAdmin(lang) {
        const settingsModel = new SettingsModelKnex(this.schema);
        const posts = await settingsModel.indexAdmin(lang);
        return CardBuilder.adminCard(posts);
    }
    async getPostById(id) {
        const settingsModel = new SettingsModelKnex(this.schema);
        const post = await settingsModel.getPostById(id);
        return CardBuilder.adminSingleCard(post);
    }
    async update(data) {
        const settingsModel = new SettingsModelKnex(this.schema);
        const response = {
            status: 'ok',
            body: []
        }
        await settingsModel.update(CardBuilder.update(data), data.id)
        return response
    }
}
module.exports = Service;
