/* eslint-env node,mocha */

const Metalsmith = require('metalsmith');
const taxonomy = require('../lib');
const assert = require('assert');
const path = require('path');
const hasOwnProperty = function (target, prop) {
  return Object.prototype.hasOwnProperty.call(target, prop);
};

describe('metalsmith-taxonomy', function () {
  this.timeout(500);
  describe('Signature', function () {
    let instance;

    this.beforeEach(function () {
      instance = Metalsmith(__dirname).source('fixtures').ignore('laptops');
    });

    it('Should support super-simple parameter-less instantiation', function (done) {
      instance.use(taxonomy()).process(function (err) {
        if (err) throw err;

        const metadata = instance.metadata();
        const validity =
          !(err && err.prototype !== Error) &&
          metadata.taxonomies.category.a.concat(metadata.taxonomies.category.b).length === 3 &&
          Object.keys(metadata.taxonomies).join(',') === 'category,tags';

        assert(validity);
        done();
      });
    });

    it('Should support namespace parameter', function (done) {
      instance.use(taxonomy({ namespace: 'blog' })).process(function (err, files) {
        if (err) throw err;

        const metadata = instance.metadata();
        const validity =
          !(err && err.prototype !== Error) &&
          metadata.taxonomies.blog.category.a.concat(metadata.taxonomies.blog.category.b).length === 3 &&
          Object.keys(metadata.taxonomies.blog).join(',') === 'category,tags' &&
          hasOwnProperty(files, path.join('blog', 'category', 'a.html')) &&
          !hasOwnProperty(files, path.join('category', 'b.html'));

        assert(validity);
        done();
      });
    });
  });

  describe('Single taxonomy', function () {
    let metadata = {};
    let categories = [];
    let taxonomies = {};
    let files = {};

    this.beforeAll(function (done) {
      const instance = Metalsmith(__dirname);
      instance
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
                const cat = Array.isArray(file.category) ? file.category : [file.category];
                return cat.indexOf('b') > -1 ? 'none' : cat;
              },
              keywords: 'meta.keywords'
            }
          })
        )
        .process(function (err, fileObjects) {
          if (err) throw err;
          files = fileObjects;
          metadata = instance.metadata();
          taxonomies = metadata.taxonomies;
          categories = metadata.taxonomies.categories;
          done();
        });
    });

    it('taxonomy termset property supports key match in file-metadata', function () {
      const validity = !!(Object.keys(categories).length === 2 && categories.a && categories.b);

      assert(validity);
    });

    it('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      const validity =
        taxonomies.keywords &&
        Object.keys(taxonomies.keywords).length === 2 &&
        taxonomies.keywords.one &&
        taxonomies.keywords.one.length === 1 &&
        taxonomies.keywords.two &&
        taxonomies.keywords.two.length === 1;

      assert(validity);
    });

    it('taxonomy termset property value supports function value', function () {
      const validity =
        taxonomies.categoryAlias &&
        Object.keys(taxonomies.categoryAlias).length === 2 &&
        taxonomies.categoryAlias.none &&
        taxonomies.categoryAlias.none.length === 1 &&
        taxonomies.categoryAlias.a &&
        taxonomies.categoryAlias.a.length === 1;

      assert(validity);
    });

    it('taxonomy term metadata supports both string and array value', function () {
      const validity = categories.a.length === 2 && categories.b.length === 1;

      assert(validity);
    });

    it('Index, taxonomy & term pages get a path property identical to their key in the files object', function () {
      const generatedPages = (key) => !!files[key].type;
      const paths = Object.keys(files)
        .filter(generatedPages)
        .map((key) => key === files[key].path);

      assert.strictEqual(paths.indexOf(false), -1);
    });

    it('Generated pages should merge metadata with existing pages (if any)', () => {
      const file = files['categories.html'];
      const valid =
        file.test === 'test' && file.taxonomy === 'categories' && file.contents.toString().trim() === 'Content';

      assert(valid);
    });
  });

  describe('Multiple taxonomies', function () {
    let metadata = {};
    let categories = [];
    let taxonomies = {};
    let laptops = {};
    let blog = {};

    this.beforeAll(function (done) {
      const instance = Metalsmith(__dirname);
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
                  const cat = Array.isArray(file.category) ? file.category : [file.category];
                  return cat.indexOf('b') > -1 ? 'none' : cat;
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
          if (err) throw err;
          metadata = instance.metadata();
          taxonomies = metadata.taxonomies;
          blog = taxonomies.blog;
          categories = taxonomies.blog.categories;
          laptops = taxonomies.laptops;
          done();
        });
    });

    it('taxonomy termset can be an array of strings matching file-metadata', function () {
      const validity = !!(Object.keys(laptops).length === 3 && laptops.screen && laptops.ram && laptops.processor);

      assert(validity);
    });

    it('taxonomy termset property supports key match in file-metadata', function () {
      const validity = !!(Object.keys(categories).length === 2 && categories.a && categories.b);

      assert(validity);
    });

    it('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      const validity =
        blog.keywords &&
        Object.keys(blog.keywords).length === 2 &&
        blog.keywords.one &&
        blog.keywords.one.length === 1 &&
        blog.keywords.two &&
        blog.keywords.two.length === 1;

      assert(validity);
    });

    it('taxonomy termset property value supports function value', function () {
      const validity =
        blog.categoryAlias &&
        Object.keys(blog.categoryAlias).length === 2 &&
        blog.categoryAlias.none &&
        blog.categoryAlias.none.length === 1 &&
        blog.categoryAlias.a &&
        blog.categoryAlias.a.length === 1;

      assert(validity);
    });

    it('taxonomy term metadata supports both string and array value', function () {
      const validity = categories.a.length === 2 && categories.b.length === 1;

      assert(validity);
    });
  });
});
