var test = require('mithril/ospec');
var Metalsmith = require('metalsmith');
var taxonomy = require('../lib');

test.spec('metalsmith-taxonomy', function () {
  test.spec('Signature', function () {
    var instance;

    test.beforeEach(function () {
      instance = Metalsmith(__dirname)
        .source('mocks')
        .destination('dist')
        .ignore('laptops');
    });

    test('Should support super-simple parameter-less instantiation', function (done) {
      instance.use(taxonomy()).process(function (err) {
        if (err) done(err);

        var metadata = this.metadata();
        var validity =
          !(err && err.prototype !== Error) &&
          metadata.taxonomies.category.a.concat(metadata.taxonomies.category.b)
            .length === 3 &&
          Object.keys(metadata.taxonomies).join(',') === 'category,tags';

        if (validity) done();
      });
    });

    test('Should support namespace parameter', function (done) {
      instance
        .use(taxonomy({ namespace: 'blog' }))
        .process(function (err, files) {
          if (err) done(err);

          var metadata = this.metadata();
          var validity =
            !(err && err.prototype !== Error) &&
            metadata.taxonomies.blog.category.a.concat(
              metadata.taxonomies.blog.category.b
            ).length === 3 &&
            Object.keys(metadata.taxonomies.blog).join(',') ===
              'category,tags' &&
            files.hasOwnProperty('blog/category/a.html') &&
            !files.hasOwnProperty('category/b.html');

          if (validity) done();
        });
    });
  });

  test.spec('Single taxonomy', function () {
    var metadata = {},
      categories = [],
      taxonomies = {};

    test.before(function (done) {
      Metalsmith(__dirname)
        .source('mocks')
        .destination('test-build')
        .ignore('laptops')
        .use(
          taxonomy({
            pages: true,
            pattern: 'posts/*.md',
            taxonomies: {
              categories: 'category',
              categoryAlias: function (file) {
                var cat = Array.isArray(file.category)
                  ? file.category
                  : [file.category];
                return cat.indexOf('b') > -1 ? 'none' : cat;
              },
              keywords: 'meta.keywords'
            }
          })
        )
        .process(function (err, filelist) {
          if (err) throw err;
          metadata = this.metadata();
          taxonomies = metadata.taxonomies;
          categories = metadata.taxonomies.categories;
          files = filelist;
          done();
        });
    });

    /*test('taxonomy object can be made accessible from a key on the metadata root', function () {
      var validity = taxonomies === metadata.blog;
  
      test(validity).equals(true);
    });*/

    test('taxonomy termset property supports key match in file-metadata', function () {
      var validity = !!(
        Object.keys(categories).length === 2 &&
        categories.a &&
        categories.b
      );

      test(validity).equals(true);
    });

    test('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      var validity =
        taxonomies.keywords &&
        Object.keys(taxonomies.keywords).length === 2 &&
        taxonomies.keywords.one &&
        taxonomies.keywords.one.length === 1 &&
        taxonomies.keywords.two &&
        taxonomies.keywords.two.length === 1;

      test(validity).equals(true);
    });

    test('taxonomy termset property value supports function value', function () {
      var validity =
        taxonomies.categoryAlias &&
        Object.keys(taxonomies.categoryAlias).length === 2 &&
        taxonomies.categoryAlias.none &&
        taxonomies.categoryAlias.none.length === 1 &&
        taxonomies.categoryAlias.a &&
        taxonomies.categoryAlias.a.length === 1;

      test(validity).equals(true);
    });

    test('taxonomy term metadata supports both string and array value', function () {
      var validity = categories.a.length === 2 && categories.b.length === 1;

      test(validity).equals(true);
    });
  });

  test.spec('Multiple taxonomies', function () {
    var metadata = {},
      categories = [],
      taxonomies = {},
      laptops = {},
      blog = {},
      files = {};

    test.before(function (done) {
      Metalsmith(__dirname)
        .source('mocks')
        .destination('dist')
        .use(
          taxonomy([
            {
              pages: true,
              pattern: 'posts/*.md',
              namespace: 'blog',
              taxonomies: {
                categories: 'category',
                categoryAlias: function (file) {
                  var cat = Array.isArray(file.category)
                    ? file.category
                    : [file.category];
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
          metadata = this.metadata();
          taxonomies = metadata.taxonomies;
          blog = taxonomies.blog;
          categories = taxonomies.blog.categories;
          laptops = taxonomies.laptops;
          files = filelist;
          done();
        });
    });

    test('taxonomy termset can be an array of strings matching file-metadata', function () {
      var validity = !!(
        Object.keys(laptops).length === 3 &&
        laptops.screen &&
        laptops.ram &&
        laptops.processor
      );

      test(validity).equals(true);
    });

    test('taxonomy termset property supports key match in file-metadata', function () {
      var validity = !!(
        Object.keys(categories).length === 2 &&
        categories.a &&
        categories.b
      );

      test(validity).equals(true);
    });

    test('taxonomy termset property value supports nested-key file-metadata lookup', function () {
      var validity =
        blog.keywords &&
        Object.keys(blog.keywords).length === 2 &&
        blog.keywords.one &&
        blog.keywords.one.length === 1 &&
        blog.keywords.two &&
        blog.keywords.two.length === 1;

      test(validity).equals(true);
    });

    test('taxonomy termset property value supports function value', function () {
      var validity =
        blog.categoryAlias &&
        Object.keys(blog.categoryAlias).length === 2 &&
        blog.categoryAlias.none &&
        blog.categoryAlias.none.length === 1 &&
        blog.categoryAlias.a &&
        blog.categoryAlias.a.length === 1;

      test(validity).equals(true);
    });

    test('taxonomy term metadata supports both string and array value', function () {
      var validity = categories.a.length === 2 && categories.b.length === 1;

      test(validity).equals(true);
    });
  });
});
