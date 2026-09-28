require("dotenv").config()
_PORT = process.env.PORT || 3000
_APP_DIR = "./app"
_NODE_ENV = process.env.NODE_ENV || "production"
_LANG = { 1: "en", 2: "ua", 3: "de", 4: "es", 5: 'fr', 6: 'ru', 7: 'ch', 8: 'pt', 9: 'it', 10: 'tr', 11: 'nl', 12: 'pl', 13: 'ro', 14: 'el', 15: 'cs', 16: 'sv', 17: 'fi', 18: 'hu', 19: 'sr', 20: 'hi' }
_SLUG_LANG = { 1: '', 2: '/ua' }
_THUMBNAIL = 'http://127.0.0.1:7000/img/default.png'
_API_URL = 'http://127.0.0.1:7000'
_CONFIG_EDITOR = {
    TEXT_DECODE: ['image', 'input', 'rich_text'],
    JSON_DECODE: ['two_input_image', 'input_text', 'multiple_menu', 'multiple_bonus', 'multiple_two_input']
}
_LANG_ID = { 'en': 1, 'ua': 2, 'de': 3, 'es': 4, 'fr': 5, 'ru': 6, 'ch': 7, 'pt': 8, 'it': 9, 'tr': 10, 'nl': 11, 'pl': 12, 'ro': 13, 'el': 14, 'cs': 15, 'sv': 16, 'fi': 17, 'hu': 18, 'sr': 19, 'hi': 20 }
