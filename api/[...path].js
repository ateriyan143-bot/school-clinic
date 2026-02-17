module.exports = async (req, res) => {
  const { default: app, ensureInitialized } = await import('../server/index.js')
  await ensureInitialized()
  return app(req, res)
}
