const { join } = require('path');
const micromatch = require('micromatch');
const { get } = require('./helpers');


/**
 * @typedef TaxonomySetParams
 * @type Object
 *
 * @property {string|string[]} pattern One or more glob patterns supported by [micromatch](https://github.com/micromatch/micromatch) for the files to include in this taxonomy set
 * @property {string} [namespace] Subkey in `metadata.taxonomies[namespace]` in which the taxonomy tree of this set will be stored.
 * @property {string[]|Object<string, string|function>} taxonomies An array containing all file metadata keys to use as taxonomies.
 *
 * Passing an object allows more flexibility in mapping taxonomy terms and values. The object's _keys_ will become the _taxonomy names_, and its _values_ will match file metadata keys.
 *
 * The file metadata key can also be a keypath (e.g. `meta.keywords`), and the file metadata value can also be an array.
 * @property {boolean|string[]} [pages=true] An array with 1 or more of: `index`, `taxonomy`, `term` allows limiting the type of pages generated.
 * Pass `true` as a shorthand for *all*, `false` as a shorthand for *none*.
 */

/**
 * @typedef TaxonomySet
 * @type Object
 *
 * @property {string|string[]} pattern
 * @property {string} namespace
 * @property {Object<string, function>} taxonomies
 * @property {boolean|string[]} [pages=true]
 */

/**
 * @type {TaxonomySet}
 */
const defaults = {
  name: null,
  namespace: null,
  pattern: '**/*.{md,html}',
  taxonomies: ['category', 'tags'],
  matchingfiles: function (paths) {
    return micromatch(paths, this.pattern, { windows: false });
  },
  indexpath: function () {
    return (this.namespace ? this.namespace : 'index') + '.html';
  },
  taxonomypath: function (taxonomy) {
    return join(this.namespace || '', `${taxonomy}.html`);
  },
  termpath: function (term, taxonomy) {
    return join(this.namespace || '', taxonomy, `${term}.html`);
  },
  constructor: function TaxonomySet() {}
};

/**
 * @param {string|Function} term
 * @param {MetalsmithFile} file
 * @returns {Function} getValues
 */
function taxonomyValueGetter(term) {
  if (typeof term === 'function') {
    return function (file, metadata) {
      return term(file, metadata) || [];
    };
  }
  if (typeof term === 'string') {
    if (term.indexOf('.') > -1) {
      return function (file) {
        const values = get(term.split('.'), file);
        return values || [];
      };
    }
    return function (file) {
      return file[term] || [];
    };
  }
  return [];
}

/**
 * Normalize a taxonomy set
 * @param {TaxonomySetParams} [params=defaults]
 * @returns {TaxonomySet}
 */
module.exports = function (params) {
  params = Object.assign(Object.create(defaults), params || {});

  if (Array.isArray(params.taxonomies)) {
    params.taxonomies = params.taxonomies.reduce(function (obj, key) {
      obj[key] = key;
      return obj;
    }, {});
  }

  Object.keys(params.taxonomies).forEach(function (key) {
    const term = params.taxonomies[key];
    params.taxonomies[key] = taxonomyValueGetter(term);
  });

  return Object.assign(params, {
    basepath: params.namespace && params.namespace.split('.').join(',')
  });
};
