const metalsmith = require('metalsmith')(__dirname)
const devserver = require('metalsmith-express')()
const ymlToHtml = require('metalsmith-rename')([['.yml', '.html']])
const taxonomy = require('metalsmith-taxonomy')({
  pattern: '**/*.yml',
  pages: ['taxonomy', 'term'],
  taxonomies: {
    filtered: 'keywords'
  }
})
const metadata = { sitename: 'Open-source licenses' }

const filemetadata = require('metalsmith-filemetadata')([
  {
    pattern: 'licenses/filtered/*/index.html',
    metadata: {
      layout: 'keyword.hbs'
    }
  },
  {
    pattern: 'licenses/index.html',
    metadata: {
      layout: 'keywords.hbs'
    }
  }
])

const layouts = require('@metalsmith/layouts')({
  directory: 'layouts',
  default: 'license.hbs',
  pattern: '**/*.html'
})

const collections = require('@metalsmith/collections')({
  licenses: '*.yml'
})

const permalinks = require('@metalsmith/permalinks')({
  linksets: [
    {
      match: { collection: 'licenses' },
      pattern: 'licenses/:id'
    },
    {
      match: { type: 'taxonomy:term' },
      pattern: 'licenses/filtered/:term'
    },
    {
      match: { type: 'taxonomy:taxonomy' },
      pattern: 'licenses'
    }
  ]
})

metalsmith
  .clean(true)
  .source('src')
  .destination('dist')
  .metadata(metadata)
  .use(collections)
  .use(taxonomy)
  .use(ymlToHtml)
  .use(permalinks)
  .use(filemetadata)
  .use(layouts)
  .use(devserver)
  .build(function (err, files) {
    if (err) throw err
  })
