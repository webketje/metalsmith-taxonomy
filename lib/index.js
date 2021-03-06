var debug = require('debug')('metalsmith-taxonomy');
debug.log = console.log.bind(console);

var taxonomyRule = require('./taxonomy-set');

function normalizePagesParam(param) {
  var defaults = ['term', 'taxonomy', 'index'];

  // handle array, filter out invalid page identifiers
  if (Array.isArray(param)) {
    return param.filter((pagetype) => defaults.includes(pagetype));
  }
  // handle bool shorthand; return defaults when pages:true, empty array when pages:false
  if (!!param === param && !param) {
    return [];
  }
  // handle undefined & other invalid values
  return defaults;
}

var page = {
  index: function (context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:index',
      namespace: context.namespace,
      taxonomies: context.taxonomies,
      path: context.path
    };
  },
  taxonomy: function (context) {
    return Object.assign(
      {
        contents: Buffer.from(''),
        type: 'taxonomy:taxonomy'
      },
      context
    );
  },
  term: function (context) {
    return Object.assign(
      {
        contents: Buffer.from(''),
        type: 'taxonomy:term'
      },
      context
    );
  }
};

/**
 * @param {import('./taxonomy-set').TaxonomySetParams|import('./taxonomy-set').TaxonomySetParams[]} taxonomySets
 * @returns {import('metalsmith').Plugin}
 */
function taxonomies(taxonomySets) {
  var singleRule = !Array.isArray(taxonomySets);

  if (singleRule) taxonomySets = [taxonomySets];
  taxonomySets = taxonomySets.map(taxonomyRule);

  return function plugin(files, metalsmith, next) {
    var metadata = metalsmith.metadata();
    var filepaths = Object.keys(files);

    if (!metadata.taxonomies) metadata.taxonomies = {};

    taxonomySets.forEach(function (rule) {
      var matchingFilepaths = rule.matchingfiles(filepaths);
      var namespace = metadata.taxonomies;

      var pages = normalizePagesParam(rule.pages || true);
      if (rule.namespace) {
        namespace = metadata.taxonomies[rule.namespace] || {};
        metadata.taxonomies[rule.namespace] = namespace;
        debug('Added taxonomy namespace "' + rule.namespace + '" at metadata.');
      }

      var pageContext = {};

      Object.keys(rule.taxonomies).forEach(function (taxonomyName) {
        var taxonomyValues = rule.taxonomies[taxonomyName];

        namespace[taxonomyName] = {};

        matchingFilepaths.forEach(function (filepath) {
          var file = files[filepath];

          var values = taxonomyValues(file, metadata);
          values = Array.isArray(values) ? values : [values];
          values.forEach(function (value) {
            if (!namespace[taxonomyName][value]) {
              namespace[taxonomyName][value] = [];
            }
            namespace[taxonomyName][value].push(file);
          });
        });

        pageContext = {
          taxonomies: namespace,
          taxonomy: taxonomyName,
          terms: Object.keys(namespace[taxonomyName]),
          namespace: rule.namespace
        };

        if (pages && pages.includes('taxonomy')) {
          const key = rule.taxonomypath(taxonomyName);
          const fileObj = page.taxonomy(Object.assign({ path: key }, pageContext));
          files[key] = Object.assign(fileObj, files[key] || {});
        }

        if (pages && pages.includes('term')) {
          Object.keys(namespace[taxonomyName]).forEach(function (term) {
            const key = rule.termpath(term, taxonomyName);
            const fileObj = page.term(Object.assign({ term: term, path: key }, pageContext));
            files[key] = Object.assign(fileObj, files[key] || {});
          });
        }

        debug(
          'Added %s files to taxonomy "%s.%s"',
          matchingFilepaths.length,
          singleRule ? '' : rule.namespace,
          taxonomyName
        );
      });

      if (pages && pages.includes('index')) {
        const key = rule.indexpath();
        const fileObj = page.index(Object.assign({ path: key }, pageContext));
        files[key] = Object.assign(fileObj, files[key] || {});
      }
    });
    next();
  };
}

module.exports = taxonomies;
