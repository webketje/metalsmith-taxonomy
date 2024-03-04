import { join } from 'path'

function getProperty(keychain, root) {
  if (root && keychain.length) {
    return getProperty(keychain, root[keychain.shift()])
  } else return root
}

/**
 * @typedef {Object} TaxonomySetParams
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
 * @param {string|Function} term
 * @param {MetalsmithFile} file
 * @returns {Function} getValues
 */
function taxonomyValueGetter(term) {
  if (typeof term === 'function') {
    return function (file, metadata) {
      return term(file, metadata) || []
    }
  }
  if (typeof term === 'string') {
    if (term.indexOf('.') > -1) {
      return function (file) {
        const values = getProperty(term.split('.'), file)
        return values || []
      }
    }
    return function (file) {
      return file[term] || []
    }
  }
  return []
}

/** @name TaxonomyNamespace */
class TaxonomyNamespace {
  /** @property {string|null} namespace */
  namespace = null

  /** @property {string|string[]} pattern */
  pattern = '**/*.{md,html}'

  /** @property {Object<string,Function>} taxonomies  */
  taxonomies = {
    tags: taxonomyValueGetter('tags'),
    category: taxonomyValueGetter('category')
  }

  /** @property {'term'|'taxonomy'|'index'[]} pages */
  pages = ['term', 'taxonomy', 'index']

  pagesExtension = '.html'

  constructor(options = {}) {
    if (options.namespace) this.namespace = options.namespace
    if (options.pattern) this.pattern = options.pattern
    if (options.pages) this.pages = this.normalizePages(options.pages)
    if (options.taxonomies) this.taxonomies = this.normalizeTaxonomies(options.taxonomies)
  }
  /**
   * Normalize
   * ```
   * ['tags'] => { tags: 'tags' } => { tags: [Function:taxonomyValueGetter('tags')]}
   * ```
   * @param {string[]|Object<string, string|Function>} taxonomies 
   */
  normalizeTaxonomies(taxonomies) {
    if (!taxonomies) taxonomies = ['category', 'tags']
    if (Array.isArray(taxonomies)) {
      taxonomies = taxonomies.reduce(function (all, taxonomy) {
        all[taxonomy] = taxonomy
        return all
      }, {})
    }

    Object.keys(taxonomies).forEach(function (key) {
      const term = taxonomies[key]
      taxonomies[key] = taxonomyValueGetter(term)
    })

    return taxonomies
  }

  normalizePages(option) {
    const defaults = this.pages
  
    // handle array, filter out invalid page identifiers
    if (Array.isArray(option)) {
      return option.filter((pagetype) => defaults.includes(pagetype))
    }
    // handle bool shorthand; return defaults when pages:true, empty array when pages:false
    if (!!option === option && !option) return []
  
    // handle undefined & other invalid values
    return defaults
  }

  pagePath(taxonomy, term) {
    // term path
    if (taxonomy && term) return join(this.namespace || '', taxonomy, `${term}${this.pagesExtension}`)

    // taxonomy path
    if (taxonomy) return join(this.namespace || '', `${taxonomy}${this.pagesExtension}`)

    // namespace path
    return (this.namespace ? this.namespace : 'index') + this.pagesExtension
  }
}

TaxonomyNamespace.create = function(options) {
  return new TaxonomyNamespace(options)
}

export default TaxonomyNamespace
