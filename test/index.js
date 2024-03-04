/* eslint-env node,mocha */
import { fileURLToPath } from 'url'
import path from 'path'

import Metalsmith from 'metalsmith'
import taxonomy from '../src/index.js'
import assert from 'assert'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const hasOwnProperty = function (target, prop) {
  return Object.prototype.hasOwnProperty.call(target, prop)
}

describe('metalsmith-taxonomy', function () {
  this.timeout(500)
  describe('Signature', function () {
    let instance

    this.beforeEach(function () {
      instance = Metalsmith(__dirname).source('fixtures').ignore('laptops')
    })

    it('Should support super-simple parameter-less instantiation', async function () {
      const files = await instance.use(taxonomy()).process()
      const metadata = instance.metadata()
      assert.deepStrictEqual(Object.keys(metadata.taxonomies), ['tags', 'category'])
      assert.deepStrictEqual(metadata.taxonomies.category.a.map(f => f.title), ['post 1', 'post 2'])
      assert.deepStrictEqual(metadata.taxonomies.category.b.map(f => f.title), ['post 1'])
      return files
    })

    it('Should support namespace parameter', async function () {
      const files = await instance.use(taxonomy({ namespace: 'blog', pages: ['term', 'index', 'taxonomy'] })).process()
      const metadata = instance.metadata()
      assert.ok(hasOwnProperty(files, path.join('blog', 'category', 'a.html')))
      assert.ok(!hasOwnProperty(files, path.join('category', 'b.html')))
      assert.deepStrictEqual(Object.keys(metadata.taxonomies.blog), ['tags', 'category'])
      assert.deepStrictEqual(metadata.taxonomies.blog.category.a.map(f => f.title), ['post 1', 'post 2'])
      assert.deepStrictEqual(metadata.taxonomies.blog.category.b.map(f => f.title), ['post 1'])
      return files
    })
  })

  describe('Single taxonomy', function () {
    let metadata = {}
    let categories = []
    let taxonomies = {}
    let files = {}

    this.beforeAll(async function () {
      const instance = Metalsmith(__dirname)
      const fileObjects = await instance
        .source('fixtures')
        .destination('test-build')
        .ignore('laptops')
        .use(
          taxonomy({
            pages: true,
            pattern: 'posts/*.md',
            taxonomies: {
              categories: 'category',
              categoryAlias: function (file) {
                const cat = Array.isArray(file.category) ? file.category : [file.category]
                return cat.indexOf('b') > -1 ? 'none' : cat
              },
              keywords: 'meta.keywords'
            }
          })
        )
        .process()
      files = fileObjects
      metadata = instance.metadata()
      taxonomies = metadata.taxonomies
      categories = metadata.taxonomies.categories
    })

    it('taxonomy termset property supports key match in file-metadata', function () {
      const validity = !!(Object.keys(categories).length === 2 && categories.a && categories.b)

      assert(validity)
    })

    it('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      const validity =
        taxonomies.keywords &&
        Object.keys(taxonomies.keywords).length === 2 &&
        taxonomies.keywords.one &&
        taxonomies.keywords.one.length === 1 &&
        taxonomies.keywords.two &&
        taxonomies.keywords.two.length === 1

      assert(validity)
    })

    it('taxonomy termset property value supports function value', function () {
      const validity =
        taxonomies.categoryAlias &&
        Object.keys(taxonomies.categoryAlias).length === 2 &&
        taxonomies.categoryAlias.none &&
        taxonomies.categoryAlias.none.length === 1 &&
        taxonomies.categoryAlias.a &&
        taxonomies.categoryAlias.a.length === 1

      assert(validity)
    })

    it('taxonomy term metadata supports both string and array value', function () {
      const validity = categories.a.length === 2 && categories.b.length === 1

      assert(validity)
    })

    it('Index, taxonomy & term pages get a path property identical to their key in the files object', function () {
      const generatedPages = (key) => !!files[key].type
      const paths = Object.keys(files)
        .filter(generatedPages)
        .map((key) => key === files[key].path)

      assert.strictEqual(paths.indexOf(false), -1)
    })

    it('Generated pages should merge metadata with existing pages (if any)', () => {
      const file = files['categories.html']
      const valid =
        file.test === 'test' && file.taxonomy === 'categories' && file.contents.toString().trim() === 'Content'

      assert(valid)
    })
  })

  describe('Multiple taxonomies', function () {
    let metadata = {}
    let categories = []
    let taxonomies = {}
    let laptops = {}
    let blog = {}

    this.beforeAll(function (done) {
      const instance = Metalsmith(__dirname)
      instance
        .source('fixtures')
        .use(
          taxonomy([
            {
              pages: true,
              pattern: 'posts/*.md',
              namespace: 'blog',
              taxonomies: {
                categories: 'category',
                categoryAlias: function (file) {
                  const cat = Array.isArray(file.category) ? file.category : [file.category]
                  return cat.indexOf('b') > -1 ? 'none' : cat
                },
                keywords: 'meta.keywords'
              }
            },
            {
              pattern: 'laptops/*.md',
              namespace: 'laptops',
              taxonomies: ['screen', 'ram', 'processor']
            }
          ])
        )
        .process(function (err, filelist) {
          if (err) throw err
          metadata = instance.metadata()
          taxonomies = metadata.taxonomies
          blog = taxonomies.blog
          categories = taxonomies.blog.categories
          laptops = taxonomies.laptops
          done()
        })
    })

    it('taxonomy termset can be an array of strings matching file-metadata', function () {
      const validity = !!(Object.keys(laptops).length === 3 && laptops.screen && laptops.ram && laptops.processor)

      assert(validity)
    })

    it('taxonomy termset property supports key match in file-metadata', function () {
      const validity = !!(Object.keys(categories).length === 2 && categories.a && categories.b)

      assert(validity)
    })

    it('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      const validity =
        blog.keywords &&
        Object.keys(blog.keywords).length === 2 &&
        blog.keywords.one &&
        blog.keywords.one.length === 1 &&
        blog.keywords.two &&
        blog.keywords.two.length === 1

      assert(validity)
    })

    it('taxonomy termset property value supports function value', function () {
      const validity =
        blog.categoryAlias &&
        Object.keys(blog.categoryAlias).length === 2 &&
        blog.categoryAlias.none &&
        blog.categoryAlias.none.length === 1 &&
        blog.categoryAlias.a &&
        blog.categoryAlias.a.length === 1

      assert(validity)
    })

    it('taxonomy term metadata supports both string and array value', function () {
      const validity = categories.a.length === 2 && categories.b.length === 1

      assert(validity)
    })
  })
})
