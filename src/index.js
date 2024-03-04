import TaxonomySpec from './taxonomy-set.js'
export { default as TaxonomySpec } from './taxonomy-set.js'

const page = {
  index(context) {
    return {
      contents: Buffer.from(''),
      type: 'taxonomy:index',
      namespace: context.namespace,
      taxonomies: context.taxonomies,
      path: context.path
    }
  },
  taxonomy(context) {
    return Object.assign(
      {
        contents: Buffer.from(''),
        type: 'taxonomy:taxonomy'
      },
      context
    )
  },
  term(context) {
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
  const singlespec = !Array.isArray(taxonomySets)

  if (singlespec) taxonomySets = [taxonomySets]
  /** @type {import('./taxonomy-set.js').default[]} */
  const specs = taxonomySets.map(TaxonomySpec.create)

  return function taxonomy(files, metalsmith, next) {
    const metadata = metalsmith.metadata()
    const debug = metalsmith.debug('metalsmith-taxonomy')

    if (!metadata.taxonomies) metadata.taxonomies = {}

    specs.forEach(function (spec) {
      const matchingFilepaths = metalsmith.match(spec.pattern, Object.keys(files))
      let namespace = metadata.taxonomies

      if (spec.namespace) {
        namespace = metadata.taxonomies[spec.namespace] || {}
        metadata.taxonomies[spec.namespace] = namespace
        debug('Added taxonomy namespace "%s" at metadata.', spec.namespace)
      }

      let pageContext = {}

      Object.keys(spec.taxonomies).forEach(function (taxonomyName) {
        const taxonomyValues = spec.taxonomies[taxonomyName]

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
          namespace: spec.namespace
        }

        if (spec.pages.includes('taxonomy')) {
          const key = spec.pagePath(taxonomyName)
          const fileObj = page.taxonomy(Object.assign({ path: key }, pageContext))
          files[key] = Object.assign(fileObj, files[key] || {})
        }

        if (spec.pages.includes('term')) {
          Object.keys(namespace[taxonomyName]).forEach(function (term) {
            const key = spec.pagePath(taxonomyName, term)
            const fileObj = page.term(Object.assign({ term, path: key }, pageContext))
            files[key] = Object.assign(fileObj, files[key] || {})
          })
        }

        debug(
          'Added %s files to taxonomy "%s%s"',
          matchingFilepaths.length,
          singlespec ? '' : `${spec.namespace}.`,
          taxonomyName
        )
      })

      if (spec.pages.includes('index')) {
        const key = spec.pagePath()
        const fileObj = page.index(Object.assign({ path: key }, pageContext))
        files[key] = Object.assign(fileObj, files[key] || {})
      }
    })
    next()
  }
}

export default taxonomy
