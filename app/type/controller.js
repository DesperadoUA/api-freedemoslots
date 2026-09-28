const { Router } = require('express')
const router = Router()
const Service = require('@/app/type/service')
const CategoryService = require('@/app/type/CategoryService')
const auth = require('@/middleware/auth')
const queryParams = require('@/middleware/queryParams')
const { cashData } = require('@/middleware/cash')
const cash = require('@/helpers/cash')
router.get("/:lang/type/:url", queryParams, cashData, async (req, res) => {
  const { lang, url } = req.params
  const { limit = 20, offset = 0 } = req.queryParams || {}
  const service = new Service()
  const response = await service.getPublicPostByUrl(url, lang, Number(limit), Number(offset))
  return cash.send(req, res, response)
});
router.post(`/admin/types`, auth, async (req, res) => {
  const service = new Service();
  const { lang, limit, offset } = req.body;
  const settings = { lang, limit, offset };
  const response = await service.indexAdmin(settings);
  res.status(200).json(response);
});
router.post(`/admin/type/category`, auth, async (req, res) => {
  const service = new CategoryService();
  const { lang, limit, offset } = req.body;
  const settings = { lang, limit, offset };
  const response = await service.indexAdmin(settings);
  res.status(200).json(response);
});
router.post(`/admin/type/delete`, auth, async (req, res) => {
  const { data } = req.body
  const service = new Service();
  await service.delete(data)
  res.status(200).json({ status: 'ok' })
})
router.post(`/admin/type/store`, async (req, res) => {
  const { data } = req.body
  const service = new Service();
  const insertId = await service.store(data)
  const response = {
    status: 'ok',
    insert_id: insertId
  }
  res.status(200).json(response)
})
router.post(`/admin/type/update`, auth, async (req, res) => {
  const { data } = req.body
  const service = new Service();
  const response = await service.update(data)
  res.status(200).json(response)
})
router.post(`/admin/type/category/update`, auth, async (req, res) => {
  const { data } = req.body
  const service = new CategoryService();
  const response = await service.update(data)
  res.status(200).json(response)
})
router.post(`/admin/type/category/store`, async (req, res) => {
  const { data } = req.body
  const service = new CategoryService();
  const insertId = await service.store(data)
  const response = {
    status: 'ok',
    insert_id: insertId
  }
  res.status(200).json(response)
});
router.post(`/admin/type/category/delete`, auth, async (req, res) => {
  const { data } = req.body
  const service = new CategoryService();
  await service.delete(data)
  res.status(200).json({ status: 'ok' })
})
router.post("/admin/type/:url", auth, async (req, res) => {
  const { url } = req.params
  const service = new Service();
  const response = await service.getPostById(url);
  if (response)
    res.status(200).json({
      status: "ok",
      body: response,
    });
  else res.status(404).json({ status: "error" });
});
router.get(`/types/:url`, async (req, res) => {
  const service = new CategoryService();
  const response = await service.getPublicPostByUrl(req.params.url);
  res.status(200).json(response);
});
router.post(`/admin/type/category/:url`, auth, async (req, res) => {
  const { url } = req.params
  const service = new CategoryService();
  const response = await service.getPostById(url)
  if (response)
    res.status(200).json({
      status: "ok",
      body: response,
    });
  else res.status(404).json({ status: "error" });
});
module.exports = router;
