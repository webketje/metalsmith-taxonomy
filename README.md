# Metalsmith taxonomy
Metalsmith plugin that organizes files into taxonomy trees in global metadata and auto-generates taxonomy page objects.

## Features

- can pre-filter files by pattern
- adds `taxonomies` hierarchy to global metadata 
- supports multiple taxonomy namespaces (e.g. blog, products, etc.)
- works well in combination with metalsmith-filemetadata, collections and permalinks
- automatically generates overview, taxonomy & taxonomy term pages (e.g. taxonomies > categories > category)

## Install

Soon on npmjs.com
<!--
NPM:
```bash
npm i -D metalsmith-taxonomy
```

Yarn:
```bash
yarn add metalsmith-taxonomy
```
-->

## Order in metalsmith plugins

Use this plugin *after* [metalsmith-collections][3], [metalsmith-filemetadata][4] and *before* [metalsmith-permalinks][5].

## Usage 

Simplest usage without parameters will inspect all `.md` and `.html` files for `category` and `tags` metadata, and generate pages in the metalsmith files at `taxonomies/category.html`, `taxonomies/tags.html`, and for each category and tag at `taxonomies/<category|tags>/<term>.html`. 

```js
metalsmith.use(taxonomy());
```

<details open>
  <summary>Result in metadata</summary>
  ```js
    {
      taxonomies: {
        tags: {
          tag1: [file, file2, ...files],
          tag2: [file, ...files]
        },
        category: {
          category1: [file, file2, ...files],
          category2: [file, ...files]
        }
      }
    }
  ```
</details>

Simple usage with file filter by pattern and added to metadata under `taxonomies.blog`:

```js
metalsmith.use(taxonomy({
  namespace: 'blog',
  pattern: 'blog/**',
  taxonomies: ['tags', 'category']
}));
```

<details>
  <summary>Result in metadata</summary>
  ```js
    {
      taxonomies: {
        blog: {
          tags: {
            tag1: [file, file2, ...files],
            tag2: [file, ...files]
          },
          category: {
            category1: [file, file2, ...files],
            category2: [file, ...files]
          }
        }
      }
    }
  ```
</details>

Multiple taxonomy groups:

```js
metalsmith.use(taxonomy([
  {
    pattern: '{products,posts}/**/*.md',
    taxonomies: {
      contentTypes: 'type'
    }
  },
  {
    pattern: 'products/**/*.md',
    pages: ['overview','taxonomy','value'],
    taxonomies: {
      shop: 'category'
    }
  },
  {
    pattern: 'posts/**/*.md',
    namespace: 'posts',
    pages: ['overview','taxonomy','value'],
    taxonomies: {
      'by category': 'category',
      'tagged': 'tags'
    }
  }
]);
```

<details>
  <summary>Result in metadata</summary>
  ```js
    {
      taxonomies: {
        contentTypes: {
          product: [file, ...files],
          post: [...files]
        },
        shop: {
          laptops: [file, file2, ...files],
          tablets: [file, ...files]
        },
        posts: {
          'by category': {
            category1: [file, file2, ...files],
            category2: [file, ...files]
          },
          tagged: {
            tag1: [file, ...files],
            tag2: [...files]
          }
        }
      }
    }
  ```
</details>

## API

```js
// single taxonomy set
metalsmith.use(taxonomy(set));
// multiple taxonomy sets
metalsmith.use(taxonomy([set, set]));
```

### Rule

| Option       | Type           | Default               | Description                                                                                                                                                       |
|--------------|----------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `pattern`    | `string|array` | `**/*.{md,html}`      | One or more [glob patterns][1] supported by [multimatch][2].                                                                                                      |
| `namespace`  | `string`       | `null`                | Subkey in `metadata.taxonomies[namespace]` in which the taxonomies                                                                                                |
| `pages`      | `boolean`      | `true`                | If `true`, pages will be generated for each taxonomy in the set, and each term of each taxonomy in the set. If `false`, no pages will be automatically generated. |
|              | `array`        |                       | An array with one or more of: `overview`, `taxonomy`, `term`.                                                                                                     |
| `taxonomies` | `array`        | `['category','tags']` | An array containing all file metadata keys to use as taxonomies                                                                                                   |
|              | `object`       |                       | Passing an object allows more flexibiliy in mapping taxonomy terms and values. The object's *keys* will become the *taxonomy names*, and its *values* should match file metadata keys. |

[1]: https://en.wikipedia.org/wiki/Glob_%28programming%29 "glob patterns on Wikipedia"
[2]: https://github.com/sindresorhus/multimatch "multimatch on Github"