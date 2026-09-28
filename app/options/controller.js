const { Router } = require("express");
const router = Router();
const Service = require('@/app/options/service')
const auth = require('@/middleware/auth')
router.get("/options", async (req, res) => {
    const service = new Service();
    const response = await service.getPosts(req.params.url);
    if (response)
        res.status(200).json({
            status: "ok",
            body: response,
        });
    else res.status(404).json({ status: "error" });
});
router.post("/admin/options/:url", auth, async (req, res) => {
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
router.post("/admin/options", auth, async (req, res) => {
    const service = new Service();
    const response = await service.indexAdmin();
    if (response)
        res.status(200).json({
            status: "ok",
            body: response,
        });
    else res.status(404).json({ status: "error" });
});
module.exports = router;
