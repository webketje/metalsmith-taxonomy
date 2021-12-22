function getProperty(keychain, root) {
  if (root && keychain.length) {
    return getProperty(keychain, root[keychain.shift()]);
  } else return root;
}

module.exports = {
  get: getProperty
}