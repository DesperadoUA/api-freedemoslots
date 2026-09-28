const OptionsModelKnex = require('@/models/OptionsKnex')
const CardBuilder = require('@/app/options/CardBuilder')
const mainSchema = require('@/schemas/options')
class Service {
    constructor() {
        this.schema = mainSchema;
    }
    async getPosts() {
        const optionsModel = new OptionsModelKnex(this.schema);
        const posts = await optionsModel.getPosts();
        return CardBuilder.mainCard(posts);
    }
    async indexAdmin() {
        const optionsModel = new OptionsModelKnex(this.schema);
        const posts = await optionsModel.getPosts();
        return CardBuilder.adminCard(posts);
    }
    async getPostById(id) {
        const optionsModel = new OptionsModelKnex(this.schema);
        const post = await optionsModel.getPostById(id);
        return CardBuilder.adminSingleCard(post);
    }
}
module.exports = Service;
