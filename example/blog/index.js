const metalsmith = require('metalsmith')(__dirname);
const devserver = require('metalsmith-express')();
const markdown = require('@metalsmith/markdown')();
const taxonomy = require('metalsmith-taxonomy')({
  pattern: 'pages/posts/*.{md,html}',
  pages: ['index', 'taxonomy', 'term'],
  namespace: 'blog',
  taxonomies: ['category', 'tags']
});

const metadata = { sitename: 'My blog' };

const filemetadata = require('metalsmith-filemetadata')([
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

const layouts = require('@metalsmith/layouts')({
  directory: 'src/layouts',
  default: 'default.hbs',
  pattern: '**/*.{md,html}',
  engineOptions: {
    helpers: {
      i18n: function (lookup, plural) {
        const dictionary = {
          tags: 'tag',
          'tags:pl': 'tags',
          category: 'category',
          'category:pl': 'categories'
        };
        return dictionary[lookup + (plural === 'pl' ? ':pl' : '')];
      }
    }
  }
});

const collections = require('@metalsmith/collections')({
  posts: 'pages/posts/*.{md,html}'
});

const permalinks = require('@metalsmith/permalinks')({
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
    }
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
    console.log('Build successful!');
  });
