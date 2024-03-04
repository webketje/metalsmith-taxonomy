export { default as TaxonomySpec } from "./taxonomy-set.js";
export default taxonomy;
/**
 * A Metalsmith plugin to organize files into taxonomy trees and auto-generate index pages for them
 * @param {import('./taxonomy-set').TaxonomySetParams|import('./taxonomy-set').TaxonomySetParams[]} taxonomySets
 * @returns {import('metalsmith').Plugin}
 */
declare function taxonomy(taxonomySets: import('./taxonomy-set').TaxonomySetParams | import('./taxonomy-set').TaxonomySetParams[]): import('metalsmith').Plugin;
