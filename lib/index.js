var debug = require('debug')('metalsmith-taxonomy');
debug.log = console.log.bind(console);

var taxonomyRule = require('./TaxonomySet');

function normalizePagesParam(param) {
  var defaults = ['term', 'taxonomy', 'index'];

  if (Array.isArray(param))
    return param.filter((pagetype) => defaults.includes(pagetype));

  if (!!param === param && !param) return [];

  return defaults;
}

var page = {
  index: function (context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:index',
      namespace: context.namespace,
      taxonomies: context.taxonomies
    };
  },
  taxonomy: function (context) {
    console.log(context);
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
 * @param {import('./TaxonomySet').TaxonomySetParams|import('./TaxonomySet').TaxonomySetParams[]} taxonomySets
 * @returns {Function} MetalsmithPlugin
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
        //setProperty(rule.namespace.split('.'), {}, metadata);
        //namespace = getProperty(rule.namespace.split('.'), metadata);
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
            if (!namespace[taxonomyName][value])
              namespace[taxonomyName][value] = [];
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
          files[rule.taxonomypath(taxonomyName)] = page.taxonomy(pageContext);
        }

        if (pages && pages.includes('term')) {
          Object.keys(namespace[taxonomyName]).forEach(function (term) {
            files[rule.termpath(term, taxonomyName)] = page.term(
              Object.assign({ term: term }, pageContext)
            );
          });
        }

        debug(
          'Added ' +
            matchingFilepaths.length +
            ' files to taxonomy "' +
            (singleRule ? '' : rule.namespace + '.') +
            taxonomyName +
            '"'
        );
      });

      if (pages && pages.includes('index')) {
        files[rule.indexpath()] = page.index(pageContext);
      }
    });

    next();
  };
}

module.exports = taxonomies;
