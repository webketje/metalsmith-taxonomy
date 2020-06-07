# Metalsmith taxonomy

Metalsmith plugin that organizes files into taxonomy trees in global metadata and auto-generates taxonomy page objects.

## Features

- can pre-filter files by pattern
- adds `taxonomies` tree to global metadata
- supports multiple taxonomy namespaces (e.g. blog, products, etc.)
- works well in combination with metalsmith-filemetadata, collections and permalinks
- automatically generates overview, taxonomy & taxonomy term pages (e.g. taxonomies > categories > category)

## Install

NPM:

```bash
npm i -D metalsmith-taxonomy
```

Yarn:

```bash
yarn add metalsmith-taxonomy
```

### Order in metalsmith plugins

Use this plugin _after_ [metalsmith-collections][3] and _before_ [metalsmith-permalinks][4] and [metalsmith-filemetadata][5]. This plugin is a replacement for metalsmith-tags, with more flexibility.

## Usage

### Quickstart

Simplest usage without parameters or with default parameters (all examples below yield the same results).

```js
var default_taxonomy_set = {
  pattern: '**/*.{md,html}',
  namespace: null,
  pages: ['index', 'taxonomy', 'term'],
  taxonomies: ['tags', 'category']
};

metalsmith.use(taxonomy());

// is the same as
metalsmith.use(taxonomy(default_taxonomy_set));

// or the same as
metalsmith.use(taxonomy([default_taxonomy_set]);
```

### Options

Pass one or more taxonomy sets to the plugin.
A taxonomy set is an object with the following properties:

| Property     | Type            | Default               | Description                                                                                                                                                                                                                                                                                                |
| :----------- | :-------------- | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pattern`    | `string\|array` | `**/*.{md,html}`      | One or more [glob patterns][1] supported by [multimatch][2].                                                                                                                                                                                                                                               |
| `namespace`  | `string`        | `null`                | Subkey in `metadata.taxonomies[namespace]` in which the taxonomies                                                                                                                                                                                                                                         |
| `pages`      | `boolean`       | `true`                | If `true`, a taxonomy set index page, pages for each taxonomy in the set, and each term of each taxonomy in the set will be generated. If `false`, no pages will be generated.                                                                                                                             |
|              | `array`         |                       | An array with one or more of: `index`, `taxonomy`, `term` allows limiting the type of pages generated.                                                                                                                                                                                                     |
| `taxonomies` | `array`         | `['category','tags']` | An array containing all file metadata keys to use as taxonomies                                                                                                                                                                                                                                            |
|              | `Object`        |                       | Passing an object allows more flexibiliy in mapping taxonomy terms and values. The object's _keys_ will become the _taxonomy names_, and its _values_ will match metadata file keys. The file metadata key can also be a keypath (e.g. `meta.keywords`), and the file metadata value can also be an array. |

### Global metadata

If you had two files with the following content:

<table>
  <tr>
    <th><code>blog/article1.md</code></th>
    <th><code>blog/article2.md</code></th>
  </tr>
  <tr>
    <td><pre>---
title: Article 1
category: category1
tags:
  - tag1
  - tag2
---</pre></td>
    <td><pre>---
title: Article 2
category: category2
tags:
  - tag2
---</pre></td>
  </tr>
</table>

The [Quickstart](#quickstart) example will generate the following results in global metadata:

```js
  {
    ...metadata,
    taxonomies: {
      tags: {
        tag1: [article1],
        tag2: [article1, article2]
      },
      category: {
        category1: [article1],
        category2: [article2]
      }
    }
  }
```

### Auto-generated index, taxonomy, and term file objects

If the `pages` property of a taxonomy set is not an empty array, or `false`, metalsmith-taxonomy will auto-generate pages at the following paths:

| Page type  | Path                              | Example                       |
| :--------- | :-------------------------------- | :---------------------------- |
| `index`    | `:namespace.html`                 | blog.html                     |
| `taxonomy` | `:namespace/:taxonomy.html`       | blog/category.html            |
| `term`     | `:namespace/:taxonomy/:term.html` | blog/category/metalsmith.html |

If `namespace` is not defined, the `index` page type path will default to `index.html`.

With the [Quickstart](#quickstart) example, metalsmith-taxonomy will generate:

```js
[
  'index.html',
  'category.html',
  'category/category1.html',
  'category/category2.html',
  'tags.html',
  'tags/tag1.html',
  'tags/tag2.html',
  ...other_files
];
```

All the file objects have an empty string `contents` property and a page `type` property. Additional details are documented below:

#### Index file object metadata

| Property     | Type               | Description                                                                                             |
| :----------- | :----------------- | :------------------------------------------------------------------------------------------------------ |
| `type`       | `'taxonomy:index'` | Page type                                                                                               |
| `namespace`  | `null\|string`     | Namespace passed in taxonomy set                                                                        |
| `taxonomies` | `object`           | Copy of the object at `metadata.taxonomies[namespace]` (or `metadata.taxonomies` if `namespace===null`) |

#### Taxonomy file object metadata

| Property     | Type                  | Description                                                                                             |
| :----------- | :-------------------- | :------------------------------------------------------------------------------------------------------ |
| `type`       | `'taxonomy:taxonomy'` | Page type                                                                                               |
| `namespace`  | `null\|string`        | Namespace passed in taxonomy set                                                                        |
| `taxonomy`   | `string`              | Name of the current taxonomy                                                                            |
| `terms`      | `array`               | Array with the terms found for the current taxonomy                                                     |
| `taxonomies` | `object`              | Copy of the object at `metadata.taxonomies[namespace]` (or `metadata.taxonomies` if `namespace===null`) |

#### Term file object metadata

| Property     | Type              | Description                                                                                             |
| :----------- | :---------------- | :------------------------------------------------------------------------------------------------------ |
| `type`       | `'taxonomy:term'` | Page type                                                                                               |
| `namespace`  | `null\|string`    | Namespace passed in taxonomy set                                                                        |
| `taxonomy`   | `string`          | Name of the current taxonomy                                                                            |
| `terms`      | `array`           | Array with the terms found for the current taxonomy                                                     |
| `taxonomies` | `object`          | Copy of the object at `metadata.taxonomies[namespace]` (or `metadata.taxonomies` if `namespace===null`) |

### Sorting the term matches

By default, the files will be sorted as they are read from the filesystem (alphabetically by file name).

The data available to metadata is a _reference_ to the items under `taxonomies[namespace][taxonomy][term]`,
so you could use [metalsmith-keymaster](https://github.com/MorganConrad/metalsmith-keymaster) or a custom plugin to sort the data:

```js
metalsmith
  .use(taxonomy)
  .use(function(files, metalsmith) {
    var taxonomies = metalsmith.metadata().taxonomies;

    Object.keys(taxonomies.tags).forEach(function(tagName) {
      taxonomies.tags[tagName].sort(function(a, b) {
        return a.order < b.order ? -1 : (a.order > b.order) ? 1 : 0;
      };
    });
  })
```

The example above shows how to sort all term collections under the `tag` taxonomy by an `order` property defined in each file's metadata.

### Custom metadata & rendering with metalsmith-layouts/filemetadata/default-values

You can use [metalsmith-filemetadata][5] to add custom data to the generated file objects by pattern,
e.g. to specify a `layout` property to be used later in the chain by [metalsmith-layouts][6].

```js
var taxonomy = require('metalsmith-taxonomy')({
  namespace: 'taxonomies',
  taxonomies: ['category', 'tags']
});

var filemetadata = require('metalsmith-filemetadata')([
  {
    pattern: 'taxonomies/**/*.html',
    metadata: { layout: 'taxonomy-term.hbs' }
  },
  {
    pattern: 'taxonomies/*.html',
    metadata: { layout: 'taxonomy.hbs' }
  },
  {
    pattern: 'taxonomies.html',
    metadata: { layout: 'taxonomy-index.hbs' }
  }
]);

var layouts = require('metalsmith-layouts')({
  directory: 'src/layouts',
  default: 'default.hbs',
  pattern: '**/*.{md,html}'
});

metalsmith.use(taxonomy).use(filemetadata).use(layouts);
```

[metalsmith-default-values](https://github.com/metalsmith/metalsmith-default-values) works exactly the same as above.

### Custom or nested page paths with metalsmith-permalinks

You can use [metalsmith-permalinks][4] to move or nest taxonomy pages:

```js
var taxonomy = require('metalsmith-taxonomy')({
  pages: ['index', 'taxonomy', 'term'],
  taxonomies: ['category', 'tags']
});

var collections = require('metalsmith-collections')({
  posts: 'posts/**/*.md'
});

var permalinks = {
  linksets: [
    {
      match: { collection: 'posts' },
      pattern: 'posts/:category/:title'
    },
    {
      match: { type: 'taxonomy:index' },
      pattern: 'posts'
    },
    {
      match: { type: 'taxonomy:term', taxonomy: 'category', namespace: 'blog' },
      pattern: 'posts/:category'
    },
    {
      match: { type: 'taxonomy:taxonomy' },
      pattern: 'posts/:taxonomy'
    },
    {
      match: { type: 'taxonomy:term', namespace: 'blog' },
      pattern: 'posts/:category'
    }
  ]
};

metalsmith.use(taxonomy).use(collections).use(permalinks);
```

with the example files from [Global metadata](#global-metadata) would result in a directory tree like:

```
└── posts
    ├── index.html --> index page
    ├── tags
    |    ├── index.html --> taxonomy page
    |    ├── tag1
    |    |    └── index.html --> term page
    |    └── tag2
    |         └── index.html --> term page
    ├── category
    |    └── index.html --> taxonomy page
    ├── category1
    |    ├── index.html --> term page
    |    └── article-1
    |         └── index.html
    └── category2
         ├── index.html --> term page
         └── article-2
              └── index.html

```

## Examples

Clone this repository and navigate to the [`example/licenses`](example/open-source-licenses) or more advanced [`example/blog`](example/blog) directory, run npm install & npm start.

## License

LGPL v0.3

[1]: https://en.wikipedia.org/wiki/Glob_%28programming%29 'glob patterns on Wikipedia'
[2]: https://github.com/sindresorhus/multimatch 'multimatch on Github'
[3]: https://github.com/segmentio/metalsmith-collections 'metalsmith-collections on Github'
[4]: https://github.com/segmentio/metalsmith-permalinks 'metalsmith-permalinks on Github'
[5]: https://github.com/dpobel/metalsmith-filemetadata 'metalsmith-filemetadata on Github'
[6]: https://github.com/metalsmith/metalsmith-layouts 'metalsmith-layouts on Github'
