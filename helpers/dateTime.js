class DateTime {
    static currentDate() {
        return new Date().toISOString().replace('T', ' ').slice(0, 19)
    }

    static toMysql(value) {
        if (!value) return null
        const date = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(date.getTime())) return null
        return date.toISOString().replace('T', ' ').slice(0, 19)
    }
}
module.exports = DateTime