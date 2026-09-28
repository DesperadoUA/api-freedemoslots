class CardBuilder {
    /*
    static category(posts) {
        const data = []
        posts.forEach(item => {
            data.push(Object.assign(this.commonDecode(item),
                {faq: JSON.parse(item.faq)},
                {parent_id: item.parent_id},
                {content: this.textDecode(item.content)}))
        })
        return data
    }
     */
    static singleAdminCategory(post) {
        if(!post) return null
        return Object.assign(this.commonAdminDecode(post), this.categoryMetaDecode(post), {content: post.content})
    }
    /*
    static singleCategory(post) {
        return Object.assign(this.commonDecode(post),
            {faq: JSON.parse(post.faq)},
            {parent_id: post.parent_id},
            {content: this.textDecode(post.content)})
    }
     */

    static commonDecode(post) {
        return {
            id: post.id,
            permalink: post.permalink,
            title: post.title,
            status: post.status,
            thumbnail: post.thumbnail,
            short_desc: post.short_desc,
            h1: post.h1,
            meta_title: post.meta_title,
            description: post.description,
            keywords: post.keywords,
            lang: post.lang,
            updated_at: post.updated_at,
            created_at: post.created_at,
        }
    }
    static commonAdminDecode(post) {
        return Object.assign(this.commonDecode(post),
            {
                permalink: post.permalink,
                content: post.content
            })
    }
    static categoryMetaDecode(post) {
        return this.parse(post.faq)
    }
    static libValidateSave(post) {
        const newData = {
            id: post.id
        }
        if(_CONFIG_EDITOR.TEXT_DECODE.includes(post.editor)) {
            newData.value = this.textValidate(post.value)
        }
        else if(_CONFIG_EDITOR.JSON_DECODE.includes(post.editor)) {
            newData.value = post.value === '' ? JSON.stringify({}) : JSON.stringify(post.value)
        }
        return newData
    }
    static textValidate(text) {
        return text.replace(/<p><\/p>/g, '').trim()
    }
    /*
    static searchAdminCard(arr) {
        if(arr.length === 0) return []
        const posts = []
        arr.forEach(item => posts.push({
            title: item.title,
            permalink: `/admin/${item.post_type}/${item.id}`
        }))
        return posts
    }
     */
    /*
    static searchCard(arr) {
        if(arr.length === 0) return []
        const posts = []
        arr.forEach(item => posts.push({
            id: item.id,
            permalink: `/${item.slug}/${item.permalink}`,
            title: item.title,
            thumbnail: item.thumbnail
        }))
        return posts
    }
     */
    /*
    static libDecode(post) {
        const newData = {
            id: post.id,
            title: post.title,
            editor: post.editor,
            key_id: post.key_id
        }
        if(_CONFIG_EDITOR.TEXT_DECODE.includes(post.editor)) {
            newData.value = this.textValidate(post.value)
        }
        else if(_CONFIG_EDITOR.JSON_DECODE.includes(post.editor)) {
            newData.value = post.value === '' ? {} : JSON.parse(post.value)
        }
        return newData
    }
    static libDecodeSpecialChars(post) {
        const newData = {
            id: post.id,
            title: post.title,
            editor: post.editor,
            key_id: post.key_id
        }
        if(_CONFIG_EDITOR.TEXT_DECODE.includes(post.editor)) {
            newData.value = this.textDecode(post.value)
        }
        else if(_CONFIG_EDITOR.JSON_DECODE.includes(post.editor)) {
            newData.value = post.value === '' ? {} : JSON.parse(post.value)
        }
        return newData
    }
     */
    /*
    static defaultCard(arr){
        if(arr.length === 0) return []
        const posts = []
        arr.forEach(item => posts.push({
            permalink: `/${item.slug}/${item.permalink}`,
            title: item.title,
        }))
        return posts
    }*/
    static getTitles(arr) {
        return arr.map(item => item.title)
    }
    static parse(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return str;
        }
    }
}
module.exports = CardBuilder