import taxonomyRule from './taxonomy-set.js'

function normalizePagesParam(param) {
  const defaults = ['term', 'taxonomy', 'index']

  // handle array, filter out invalid page identifiers
  if (Array.isArray(param)) {
    return param.filter((pagetype) => defaults.includes(pagetype))
  }
  // handle bool shorthand; return defaults when pages:true, empty array when pages:false
  if (!!param === param && !param) {
    return []
  }
  // handle undefined & other invalid values
  return defaults
}

const page = {
  index: function (context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:index',
      namespace: context.namespace,
      taxonomies: context.taxonomies,
      path: context.path
    }
  },
  taxonomy: function (context) {
    return Object.assign(
      {
        contents: Buffer.from(''),
        type: 'taxonomy:taxonomy'
      },
      context
    )
  },
  term: function (context) {
    return Object.assign(
      {
        contents: Buffer.from(''),
        type: 'taxonomy:term'
      },
      context
    )
  }
}

/**
 * A Metalsmith plugin to organize files into taxonomy trees and auto-generate index pages for them
 * @param {import('./taxonomy-set').TaxonomySetParams|import('./taxonomy-set').TaxonomySetParams[]} taxonomySets
 * @returns {import('metalsmith').Plugin}
 */
function taxonomy(taxonomySets) {
  const singleRule = !Array.isArray(taxonomySets)

  if (singleRule) taxonomySets = [taxonomySets]
  taxonomySets = taxonomySets.map(taxonomyRule)

  return function taxonomy(files, metalsmith, next) {
    const metadata = metalsmith.metadata()
    const debug = metalsmith.debug('metalsmith-taxonomy')

    if (!metadata.taxonomies) metadata.taxonomies = {}

    taxonomySets.forEach(function (rule) {
      const matchingFilepaths = metalsmith.match(rule.pattern, Object.keys(files))
      let namespace = metadata.taxonomies

      const pages = normalizePagesParam(rule.pages || true)
      if (rule.namespace) {
        namespace = metadata.taxonomies[rule.namespace] || {}
        metadata.taxonomies[rule.namespace] = namespace
        debug('Added taxonomy namespace "' + rule.namespace + '" at metadata.')
      }

      let pageContext = {}

      Object.keys(rule.taxonomies).forEach(function (taxonomyName) {
        const taxonomyValues = rule.taxonomies[taxonomyName]

        namespace[taxonomyName] = {}

        matchingFilepaths.forEach(function (filepath) {
          const file = files[filepath]

          let values = taxonomyValues(file, metadata)
          values = Array.isArray(values) ? values : [values]
          values.forEach(function (value) {
            if (!namespace[taxonomyName][value]) {
              namespace[taxonomyName][value] = []
            }
            namespace[taxonomyName][value].push(file)
          })
        })

        pageContext = {
          taxonomies: namespace,
          taxonomy: taxonomyName,
          terms: Object.keys(namespace[taxonomyName]),
          namespace: rule.namespace
        }

        if (pages && pages.includes('taxonomy')) {
          const key = rule.taxonomypath(taxonomyName)
          const fileObj = page.taxonomy(Object.assign({ path: key }, pageContext))
          files[key] = Object.assign(fileObj, files[key] || {})
        }

        if (pages && pages.includes('term')) {
          Object.keys(namespace[taxonomyName]).forEach(function (term) {
            const key = rule.termpath(term, taxonomyName)
            const fileObj = page.term(Object.assign({ term, path: key }, pageContext))
            files[key] = Object.assign(fileObj, files[key] || {})
          })
        }

        debug(
          'Added %s files to taxonomy "%s%s"',
          matchingFilepaths.length,
          singleRule ? '' : `${rule.namespace}.`,
          taxonomyName
        )
      })

      if (pages && pages.includes('index')) {
        const key = rule.indexpath()
        const fileObj = page.index(Object.assign({ path: key }, pageContext))
        files[key] = Object.assign(fileObj, files[key] || {})
      }
    })
    next()
  }
}

export default taxonomy
