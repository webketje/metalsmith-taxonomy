var debug = require('debug')('metalsmith-taxonomy');
debug.log = console.log.bind(console);

var taxonomyRule = require('./taxonomy-rule');

function setProperty(keychain, value, root) {
  var key = keychain.shift();
  if (root && keychain.length) {
    root[key] = {}; 
    setProperty(keychain, value, root[key]);
  } else
    root[key] = value;
}

function getProperty(keychain, root) {
  if (root && keychain.length)
    return getProperty(keychain, root[keychain.shift()]);
  else
    return root;
}

function normalizePagesParam(param) {
  var pagesArray = [];
  if (param) {
    if (Array.isArray(param))
      pagesArray = param;
    else if (!!param === param) {
      if (!!param)
        pagesArray = ['term', 'taxonomy'];
      else
        pagesArray = false;
    } else if (param.hasOwnProperty) {
      pagesArray = Object.keys(param);
      Object.values(param).forEach(function(value, index) {
        pagesArray[pagesArray[index]] = typeof value === 'function' ?
          function(file, metadata) { return page(pagesArray[index], value(file, metadata) || {}); } : function() { return page(pagesArray[index], value); }
      });
    }
  }
  
  return pagesArray;
}

var page = {
  term: function(name, context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:term',
      term: name,
      items: context.taxonomy.items[name],
      taxonomy: context.taxonomy,
      taxonomies: context.namespace
    };
  },
  taxonomy: function(name, context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:taxonomy',
      name: name,
      items: context.taxonomy.items,
      taxonomy: context.taxonomy,
      taxonomies: context.namespace
    }
  },
  overview: function(name, context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:overview',
      name: name,
      taxonomies: context.namespace
    }
  }
}

/**
 * @param {import('./taxonomy-rule').TaxonomyRuleParams|import('./taxonomy-rule').TaxonomyRuleParams[]} rules
 * @returns {Function} MetalsmithPlugin
 */
function taxonomies(rules) {
  var singleRule = !Array.isArray(rules);

  if (singleRule)
    rules = [rules];
  rules = rules.map(taxonomyRule);

  return function plugin(files, metalsmith, next) {
    var metadata = metalsmith.metadata();
    var filepaths = Object.keys(files);

    if (!metadata.taxonomies)
      metadata.taxonomies = {};

    rules.forEach(function (rule) {
      var matchingFilepaths = rule.matchingfiles(filepaths);
      var namespace = metadata.taxonomies;

      var pages = normalizePagesParam(rule.pages || true);
      if (rule.namespace) {
        //setProperty(rule.namespace.split('.'), {}, metadata);
        //namespace = getProperty(rule.namespace.split('.'), metadata);
        var namespace = metadata.taxonomies[rule.namespace] || {};
        metadata.taxonomies[rule.namespace] = namespace;
        debug('Added taxonomy namespace "' + rule.namespace + '" at metadata.');
      }

      var pageContext = {};

      Object.keys(rule.taxonomies).forEach(function (taxonomyName) {
        var taxonomyValues = rule.taxonomies[taxonomyName];

        namespace[taxonomyName] = {};

        pageContext = {
          taxonomy: { name: taxonomyName, items: namespace[taxonomyName] },
          namespace: { group: rule.namespace, items: namespace }
        };

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

        if (pages && pages.includes('taxonomy')) {
          files[rule.taxonomypath(taxonomyName)] = page.taxonomy(taxonomyName, pageContext);
        }

        if (pages && pages.includes('term')) {
          Object.keys(namespace[taxonomyName]).forEach(function(term) {
            files[rule.termpath(term, taxonomyName)] = page.term(term, pageContext);
          });
        }

        debug('Added ' + matchingFilepaths.length + ' files to taxonomy "' + (singleRule ? '' : rule.namespace + '.') + taxonomyName + '"');
      });

      if (pages && pages.includes('overview')) {
        files[rule.overviewpath()] = page.overview(rule.namespace, pageContext);
      }

    });

    next();
  };
}

module.exports = taxonomies;