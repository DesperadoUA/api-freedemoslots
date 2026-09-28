const PostModel = require("./PostsKnex");

class SlotModelKnex {
  #postModel;

  constructor(schema) {
    this.schema = schema;
    this.#postModel = new PostModel(schema);
  }

  async getPublicPostByUrl(url, vendor, lang) {
    return this.#postModel.getPublicPostByVendorPermalink(url, vendor, lang);
  }
}
module.exports = SlotModelKnex;
