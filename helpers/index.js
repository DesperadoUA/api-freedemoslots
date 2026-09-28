const slugify = require('slugify')
const {decode} = require("html-entities");
class Helper {
    static transliterateUrl(str) {
        return slugify(str, {
            replacement: '-',
            remove: /[*+~.()'"!:@]/g,
            lower: true,
            strict: false,
            trim: true
        })
    }
    static metaSave(data, configEditor) {
        const newData = {}
        for (let key in configEditor) {
            if(key in data) {
                newData[key] = configEditor[key].dataType === 'JSON'
                    ? JSON.stringify(data[key])
                    : data[key]
            }
            else {
                newData[key] = configEditor[key].dataType === 'JSON'
                    ? JSON.stringify(configEditor[key].default)
                    : configEditor[key].default
            }
        }
        return newData
    }
    static metaDecode(data, configEditor) {
        const newData = {}
        for (let key in configEditor) {
            if(key in data) {
                newData[key] = configEditor[key].dataType === 'JSON'
                    ? JSON.parse(data[key])
                    : data[key]
            }
            else {
                newData[key] = configEditor[key].default
            }
        }
        return newData
    }
    static createSchemas(fields, DataTypes) {
        const data = {}
        for(let key in fields) {
            data[key] = {}
            for(let keySchemas in fields[key].schemas) {
                if(keySchemas === 'type') {
                    data[key][keySchemas] = DataTypes[fields[key].schemas[keySchemas]]
                } else {
                    data[key][keySchemas] = fields[key].schemas[keySchemas]
                }
            }
        }
        return data
    }
    static replaceHeadings(str) {
        [
            {old:'<h2', new: "<h2 class='heading' data-deep='first' "},
            {old:'<h3', new: "<h3 class='heading' data-deep='second' "},
            {old:'<h4', new: "<h4 class='heading' data-deep='second' "},
            {old:'<h5', new: "<h5 class='heading' data-deep='second' "},
            {old:'<h6', new: "<h6 class='heading' data-deep='second' "}
        ].forEach(item => {
            const old = new RegExp(item.old, 'g');
            str = str.replace(old, item.new)
        })
        return str
    }
    static applyToc(html) {
        const toc = []
        const used = new Set()
        const source = String(html || '')
        if (!source) return { content: source, toc }

        const content = source.replace(/<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
            const text = String(inner || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
            if (!text) return match

            const attrStr = attrs || ''
            const existing = attrStr.match(/\sid=["']([^"']+)["']/i)
            let id = (existing && existing[1]) || slugify(text, {
                replacement: '-',
                lower: true,
                strict: true,
                trim: true
            }) || 'heading'
            if (used.has(id)) {
                let n = 2
                while (used.has(`${id}-${n}`)) n++
                id = `${id}-${n}`
            }
            used.add(id)
            toc.push({ id, text, level: Number(tag[1]) })

            let nextAttrs = attrStr
            if (/\sid=/i.test(nextAttrs)) {
                nextAttrs = nextAttrs.replace(/\sid=["'][^"']*["']/i, ` id="${id}"`)
            } else {
                nextAttrs = ` id="${id}"${nextAttrs}`
            }
            return `<${tag}${nextAttrs}>${inner}</${tag}>`
        })

        return { content, toc }
    }
    static isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    static textDecode(text) {
        let newData = text.replace(/<p><\/p>/g, '').trim()
        newData = newData.replace(/<pre class="ql-syntax" spellcheck="false">/g, '')
        newData = newData.replace(/<\/pre>/g, '')
        return decode(newData)
    }
}
module.exports = Helper