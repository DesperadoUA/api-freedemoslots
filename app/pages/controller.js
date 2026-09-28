const { Router } = require('express')
const Service = require('@/app/pages/service')
const auth = require('@/middleware/auth')
const queryParams = require('@/middleware/queryParams')
const { cashData } = require('@/middleware/cash')
const cash = require('@/helpers/cash')
const asyncHandler = require('@/helpers/asyncHandler')

const service = new Service()
const router = Router()

router.get(
  '/:lang/page/main',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const page = await service.mainPage(lang)
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/providers',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.providersPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/slot-themes',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.slotThemesPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/slot-features',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.slotFeaturesPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/volatillity-rate',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.volatilityPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/casino-games',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.casinoGamesPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/casino-game-series',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.casinoSeriesPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/live-casino-games',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang } = req.params
    const { limit = 10, offset = 0 } = req.queryParams || {}
    const page = await service.liveCasinoGamesPage(lang, Number(limit), Number(offset))
    return cash.send(req, res, page)
  })
)

router.get(
  '/:lang/page/:url',
  queryParams,
  cashData,
  asyncHandler(async (req, res) => {
    const { lang, url } = req.params
    const page = await service.getPublicPostByUrl(url, lang)
    return cash.send(req, res, page)
  })
)

router.get(
  '/pages',
  asyncHandler(async (req, res) => {
    const { lang, limit, offset } = req.body
    const response = await service.getPublicPosts({ lang, limit, offset })
    if (!response) {
      res.status(404).json({ status: 'error' })
      return
    }
    res.status(200).json({ status: 'ok', body: response })
  })
)

router.post(
  '/admin/pages/update',
  auth,
  asyncHandler(async (req, res) => {
    const { data } = req.body
    const response = await service.update(data)
    res.status(200).json(response)
  })
)

router.post(
  '/admin/pages/:url',
  auth,
  asyncHandler(async (req, res) => {
    const { url } = req.params
    const response = await service.getPostById(url)
    if (!response) {
      res.status(404).json({ status: 'error' })
      return
    }
    res.status(200).json({ status: 'ok', body: response })
  })
)

router.post(
  '/admin/pages',
  auth,
  asyncHandler(async (req, res) => {
    const { lang, limit, offset } = req.body
    const response = await service.indexAdmin({ lang, limit, offset })
    res.status(200).json(response)
  })
)

module.exports = router
