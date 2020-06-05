var metalsmith = require('metalsmith')(__dirname);
var devserver = require('metalsmith-express')();
var markdown = require('metalsmith-markdown')();
var taxonomy = require('metalsmith-taxonomy')({
  pattern: 'pages/posts/*.{md,html}',
  pages: ['index','taxonomy','term'],
  namespace: 'blog',
  taxonomies: ['category','tags']
});

var metadata = { sitename: 'My blog' };

var filemetadata = require('metalsmith-filemetadata')([
  {
    pattern: 'blog/*/*/*.html',
    metadata: {
      layout: 'taxonomy-term.hbs'
    }
  },
  {
    pattern: 'blog/*/*.html',
    metadata: {
      layout: 'taxonomy.hbs'
    }
  },
  {
    pattern: 'blog/index.html',
    metadata: {
      layout: 'taxonomy-index.hbs'
    }
  }
]);

var layouts = require('metalsmith-layouts')({
  directory: 'src/layouts',
  default: 'default.hbs',
  pattern: '**/*.{md,html}',
  engineOptions: {
    helpers: {
      i18n: function(lookup, plural) {
        var dictionary = {
          'tags': 'tag',
          'tags:pl': 'tags',
          'category': 'category',
          'category:pl': 'categories'
        };
        return dictionary[lookup + (plural === 'pl'? ':pl' : '')];
      }
    }
  }
});

var collections = require('metalsmith-collections')({
  posts: 'pages/posts/*.{md,html}'
});

var permalinks = require('metalsmith-permalinks')({
  linksets: [
    {
      match: { collection: 'posts' },
      pattern: 'blog/posts/:category/:title'
    },
    {
      match: { type: 'taxonomy:index' },
      pattern: 'blog'
    },
    {
      match: { type: 'taxonomy:taxonomy' },
      pattern: 'blog/:taxonomy'
    },
    {
      match: { type: 'taxonomy:term' },
      pattern: 'blog/:taxonomy/:term'
    },
  ]
});

metalsmith
  .clean(true)
  .source('src')
  .destination('dist')
  .ignore('layouts')
  .metadata(metadata)
  .use(collections)
  .use(taxonomy)
  .use(markdown)
  .use(permalinks)
  .use(filemetadata)
  .use(layouts)
  .use(devserver)
  .build(function (err, files) {
    if (err) throw err;
    console.log('Build successful!')
  });
