const { Router } = require("express");
const router = Router();
const Service = require('@/app/settings/service')
const auth = require('@/middleware/auth')
router.get("/:lang/settings", async (req, res) => {
    const lang = _LANG_ID[req.params.lang] || Number(req.params.lang) || 1;
    const service = new Service();
    const response = await service.getPosts(lang);
    if (response)
        res.status(200).json({
            status: "ok",
            body: response,
        });
    else res.status(404).json({ status: "error" });
});
router.post('/admin/settings/update', auth, async (req, res) => {
    const {data} = req.body
    const service = new Service();
    const response = await service.update(data)
    res.status(200).json(response)
})
router.post("/admin/settings/:url", auth, async (req, res) => {
    const { url } = req.params
    const service = new Service();
    const response = await service.getPostById(url)
    if (response)
        res.status(200).json({
            status: "ok",
            body: response,
        });
    else res.status(404).json({ status: "error" });
});
router.post("/admin/settings", auth, async (req, res) => {
    const { lang } = req.body;
    const service = new Service();
    const response = await service.indexAdmin(lang);
    if (response)
        res.status(200).json({
            status: "ok",
            body: response,
            lang: lang === 1 ? 'ru' : 'ua'
        });
    else res.status(404).json({ status: "error" });
});
module.exports = router;
