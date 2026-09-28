const { Router } = require('express')
const router = Router()
const Service = require('@/app/series/service')
const CategoryService = require('@/app/series/CategoryService')
const auth = require('@/middleware/auth')
const queryParams = require('@/middleware/queryParams')
const { cashData } = require('@/middleware/cash')
const cash = require('@/helpers/cash')
router.get("/:lang/series/:url", queryParams, cashData, async (req, res) => {
  const { lang, url } = req.params
  const service = new Service()
  const { limit = 20, offset = 0 } = req.queryParams || {}
  const response = await service.getPublicPostByUrl(url, lang, Number(limit), Number(offset))
  return cash.send(req, res, response)
});
router.post(`/admin/series`, auth, async (req, res) => {
  const service = new Service();
  const { lang, limit, offset } = req.body;
  const settings = { lang, limit, offset };
  const response = await service.indexAdmin(settings);
  res.status(200).json(response);
});
router.post(`/admin/series/category`, auth, async (req, res) => {
  const service = new CategoryService();
  const { lang, limit, offset } = req.body;
  const settings = { lang, limit, offset };
  const response = await service.indexAdmin(settings);
  res.status(200).json(response);
});
router.post(`/admin/series/delete`, auth, async (req, res)=>{
  const {data} = req.body
  const service = new Service();
  await service.delete(data)
  res.status(200).json({status: 'ok'})
})
router.post(`/admin/series/store`, async (req, res) => {
  const {data} = req.body
  const service = new Service();
  const insertId = await service.store(data)
  const response = {
    status: 'ok',
    insert_id: insertId
  }
  res.status(200).json(response)
})
router.post(`/admin/series/update`, auth, async (req, res)=> {
  const {data} = req.body
  const service = new Service();
  const response = await service.update(data)
  res.status(200).json(response)
})
router.post(`/admin/series/category/update`, auth, async (req, res)=> {
  const {data} = req.body
  const service = new CategoryService();
  const response = await service.update(data)
  res.status(200).json(response)
})
router.post(`/admin/series/category/store`, async (req, res) => {
  const {data} = req.body
  const service = new CategoryService();
  const insertId = await service.store(data)
  const response = {
    status: 'ok',
    insert_id: insertId
  }
  res.status(200).json(response)
});
router.post(`/admin/series/category/delete`, auth, async (req, res)=>{
  const {data} = req.body
  const service = new CategoryService();
  await service.delete(data)
  res.status(200).json({status: 'ok'})
})
router.post("/admin/series/:url", auth, async (req, res) => {
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
router.get(`/series/:url`, async (req, res) => {
  const service = new CategoryService();
  const response = await service.getPublicPostByUrl(req.params.url);
  res.status(200).json(response);
});
router.post(`/admin/series/category/:url`, auth, async (req, res) => {
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
