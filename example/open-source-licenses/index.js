var metalsmith = require('metalsmith')(__dirname);
var devserver = require('metalsmith-express')();
var ymlToHtml = require('metalsmith-rename')([['.yml', '.html']]);
var taxonomy = require('metalsmith-taxonomy')({
  pattern: '**/*.yml',
  pages: ['taxonomy', 'term'],
  taxonomies: {
    filtered: 'keywords',
  }
});
var metadata = { sitename: 'Open-source licenses' };

var filemetadata = require('metalsmith-filemetadata')([
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
  },
]);

var layouts = require('metalsmith-layouts')({
  directory: 'layouts',
  default: 'license.hbs',
  pattern: '**/*.html'
});

var collections = require('metalsmith-collections')({
  licenses: '*.yml'
});

var permalinks = require('metalsmith-permalinks')({
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
    if (err) throw err;
  });
