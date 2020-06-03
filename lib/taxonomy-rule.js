var path = require('path');
var multimatch = require('multimatch');

function getProperty(keychain, root) {
  if (root && keychain.length)
    return getProperty(keychain, root[keychain.shift()]);
  else
    return root;
}

/**
 * @typedef TaxonomyRuleParams
 * @type Object
 * @property {string|string[]} pattern
 * @property {string} [namespace='taxonomies']
 * @property {string[]|Object<string, string|function>} taxonomies
 * @property {boolean|string[]} [pages=true]
 */

/**
 * @typedef TaxonomyRule
 * @type Object
 * @property {string|string[]} pattern
 * @property {string} namespace
 * @property {Object<string, function>} taxonomies
 * @property {boolean|string[]} [pages=true]
 */

/**
 * @type {TaxonomyRule}
 */
var defaults = {
  name: null,
  namespace: null,
  pattern: '**/*.{md,html}',
  taxonomies: ['category', 'tags'],
  matchingfiles: function(paths) { return multimatch(paths, this.pattern); },
  overviewpath: function() { return path.join('taxonomies', (this.namespace ? this.namespace : '') + '.html'); },
  taxonomypath: function(taxonomy) { return path.join('taxonomies', (this.namespace ? this.namespace + path.sep : '') + taxonomy + '.html'); },
  termpath: function(term, taxonomy) { return path.join('taxonomies', (this.namespace ? this.namespace + path.sep : '') + taxonomy, term + '.html'); },
  constructor: function TaxonomyRule() {}
};

/**
 * @param {string|Function} term 
 * @param {MetalsmithFile} file 
 * @returns {Function} getValues
 */
function taxonomyValueGetter(term) {
  if (typeof term === 'function')
    return function (file, metadata) {
      return term(file, metadata) || [];
    };
  if (typeof term === 'string') {
    if (term.indexOf('.') > -1)
      return function (file) {
        var values = getProperty(term.split('.'), file)
        return values || [];
      }
    return function (file) {
      return file[term] || [];
    };
  }
  return [];
}

/**
 * Normalize a taxonomy rule
 * @param {TaxonomyRuleParams} [params=defaults]
 * @returns {TaxonomyRule}
 */
module.exports = function(params) {
  params = Object.assign(Object.create(defaults), (params || {}));

  if (Array.isArray(params.taxonomies))
    params.taxonomies = params.taxonomies.reduce(function (obj, key) {
      obj[key] = key;
      return obj;
    }, {});
  
  Object.keys(params.taxonomies).forEach(function(key) {
    var term = params.taxonomies[key];
    params.taxonomies[key] = taxonomyValueGetter(term);
  });

  return Object.assign(params, { basepath: params.namespace && params.namespace.split('.').join(',') });
}