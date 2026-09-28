const crypto = require("crypto")
const fs = require('fs')
const Helper = require('@/helpers')

const safeUploadName = (name) => {
    const base = String(name || 'file').trim()
    const dot = base.lastIndexOf('.')
    const ext = dot > 0 ? base.slice(dot).toLowerCase() : ''
    const stem = dot > 0 ? base.slice(0, dot) : base
    const slug = Helper.transliterateUrl(stem) || 'file'
    return `${slug}${ext}`
}

class UploadService {
    static async upload(name, str) {
        const data = str.split(";base64,")
        const response = {
            confirm: 'ok',
            src: ''
        }
        try {
            const safeName = safeUploadName(name)
            if(safeName.endsWith('.png') || safeName.endsWith('.jpg') || safeName.endsWith('.jpeg') || safeName.endsWith('.webp') || safeName.endsWith('.svg')) {
                const buff = Buffer.from(data[1], 'base64')
                const token = crypto.randomBytes(8).toString("hex")
                const path = `./public/uploads/${token}-${safeName}`
                await fs.writeFileSync(path, buff)
                response.src = `${_API_URL}/uploads/${token}-${safeName}`
                return response
            } else {
                response.confirm = 'error'
                return response
            }
        } catch (error) {
            console.log(error)
            response.confirm = 'error'
            return response
        }
    }
    static media () {
        const MAX_ARR_IMG = 2000
        const response = {
            confirm: 'ok',
            body: []
        }
        try {
            const path = `./public/uploads/`
            const files = fs.readdirSync(path).slice(0, MAX_ARR_IMG)
            response.body = files.map(item => `${_API_URL}/uploads/${item}`)
            return response
        }
        catch (error) {
            console.log(error)
            response.confirm = 'error'
            return response
        }
    }
    static delete(path) {
        const [file] = path.split('/').splice(-1,1)
        const filePath = `./public/uploads/${file}`
        const response = {
            confirm: 'ok',
            body: []
        }
        try {
            fs.unlinkSync(filePath)
            return response
        } catch(error) {
            console.log(error)
            response.confirm = 'error'
            return response
        }
    }
}
module.exports = UploadService