'use strict'

const express = require('express')
const router = express.Router()
const _ = require('lodash')

const entryHelper = require('../helpers/entry')

// ==========================================
// EDIT MODE
// ==========================================

/**
 * Edit document in Markdown
 */
router.get('/edit/*', (req, res, next) => {
  if (!res.locals.rights.write) {
    return res.render('error-forbidden')
  }

  let safePath = entryHelper.parsePath(_.replace(req.path, '/edit', ''))

  entries.fetchOriginal(safePath, {
    parseMarkdown: false,
    parseMeta: true,
    parseTree: false,
    includeMarkdown: true,
    includeParentInfo: false,
    cache: false
  }).then((pageData) => {
    if (pageData) {
      res.render('pages/edit', { pageData })
    } else {
      throw new Error('Invalid page path.')
    }
    return true
  }).catch((err) => {
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
})

router.put('/edit/*', (req, res, next) => {
  if (!res.locals.rights.write) {
    return res.json({
      ok: false,
      error: 'Forbidden'
    })
  }

  let safePath = entryHelper.parsePath(_.replace(req.path, '/edit', ''))

  entries.update(safePath, req.body.markdown, req.user).then(() => {
    return res.json({
      ok: true
    }) || true
  }).catch((err) => {
    res.json({
      ok: false,
      error: err.message
    })
  })
})

// ==========================================
// CREATE MODE
// ==========================================

router.get('/create/*', (req, res, next) => {
  if (!res.locals.rights.write) {
    return res.render('error-forbidden')
  }

  if (_.some(['create', 'edit', 'account', 'source', 'history', 'mk', 'all'], (e) => { return _.startsWith(req.path, '/create/' + e) })) {
    return res.render('error', {
      message: 'You cannot create a document with this name as it is reserved by the system.',
      error: {}
    })
  }

  let safePath = entryHelper.parsePath(_.replace(req.path, '/create', ''))

  entries.exists(safePath).then((docExists) => {
    if (!docExists) {
      return entries.getStarter(safePath).then((contents) => {
        let pageData = {
          markdown: contents,
          meta: {
            title: _.startCase(safePath),
            path: safePath
          }
        }
        res.render('pages/create', { pageData })

        return true
      }).catch((err) => {
        winston.warn(err)
        throw new Error('Could not load starter content!')
      })
    } else {
      throw new Error('This entry already exists!')
    }
  }).catch((err) => {
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
})

router.put('/create/*', (req, res, next) => {
  if (!res.locals.rights.write) {
    return res.json({
      ok: false,
      error: 'Forbidden'
    })
  }

  let safePath = entryHelper.parsePath(_.replace(req.path, '/create', ''))

  entries.create(safePath, req.body.markdown, req.user).then(() => {
    return res.json({
      ok: true
    }) || true
  }).catch((err) => {
    return res.json({
      ok: false,
      error: err.message
    })
  })
})

// ==========================================
// LIST ALL PAGES
// ==========================================

/**
 * View tree view of all pages
 */
router.use((req, res, next) => {
  if (_.endsWith(req.url, '/all')) {
    res.render('pages/all')
  } else {
    next()
  }
})

// ==========================================
// VIEW MODE
// ==========================================

/**
 * View source of a document
 */
router.get('/source/*', (req, res, next) => {
  let safePath = entryHelper.parsePath(_.replace(req.path, '/source', ''))

  entries.fetchOriginal(safePath, {
    parseMarkdown: false,
    parseMeta: true,
    parseTree: false,
    includeMarkdown: true,
    includeParentInfo: false,
    cache: false
  }).then((pageData) => {
    if (pageData) {
      res.render('pages/source', { pageData })
    } else {
      throw new Error('Invalid page path.')
    }
    return true
  }).catch((err) => {
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
})

/**
 * View history of a document
 */
router.get('/hist/*', (req, res, next) => {
  let safePath = entryHelper.parsePath(_.replace(req.path, '/hist', ''))

  entries.getHistory(safePath).then((pageData) => {
    if (pageData) {
      res.render('pages/history', { pageData })
    } else {
      throw new Error('Invalid page path.')
    }
    return true
  }).catch((err) => {
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
})

/**
 * View document
 */
router.get('/*', (req, res, next) => {
  let safePath = entryHelper.parsePath(req.path)

  entries.fetch(safePath).then((pageData) => {
    if (pageData) {
      res.render('pages/view', { pageData })
    } else {
      res.render('error-notexist', {
        newpath: safePath
      })
    }
    return true
  }).error((err) => {
    if (safePath === 'home') {
      res.render('pages/welcome')
    } else {
      res.render('error-notexist', {
        message: err.message,
        newpath: safePath
      })
    }
    return true
  }).catch((err) => {
    res.render('error', {
      message: err.message,
      error: {}
    })
  })
})

/**
 * Move document
 */
router.put('/*', (req, res, next) => {
  if (!res.locals.rights.write) {
    return res.json({
      ok: false,
      error: 'Forbidden'
    })
  }

  let safePath = entryHelper.parsePath(req.path)

  if (_.isEmpty(req.body.move)) {
    return res.json({
      ok: false,
      error: 'Invalid document action call.'
    })
  }

  let safeNewPath = entryHelper.parsePath(req.body.move)

  entries.move(safePath, safeNewPath, req.user).then(() => {
    res.json({
      ok: true
    })
  }).catch((err) => {
    res.json({
      ok: false,
      error: err.message
    })
  })
})

module.exports = router
