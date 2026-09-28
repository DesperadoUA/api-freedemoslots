const { Router } = require("express");
const router = Router();
const auth = require('@/middleware/auth')
const Service = require('@/app/search/service')
router.post("/admin/search", auth, async (req, res) => {
    const { lang, postType, searchWord } = req.body;
    const response =  {
        status: 'ok',
        body: await Service.adminSearch(lang, searchWord, postType)
    }
    res.status(200).json(response);
});
module.exports = router;