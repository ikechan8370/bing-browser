const toml = require('toml');
const fs = require("fs")

/**
 *
 * @type {{proxy: {cf?: string, proxy: string, username?: string, password?: string, headless?: boolean, executablePath?: string}, puppeteer: {executable_path?: string}}
 */
global.config = {}

/**
 *
 * @param path
 * @returns {{proxy: {cf?: string, proxy: string, username?: string, password?: string, headless?: boolean, executablePath?: string}, puppeteer: {executable_path?: string}}
 */
function readConfig (path = "config.toml") {
    const file = fs.readFileSync(path)
    let cfg = toml.parse(String(file))
    global.config = cfg
    console.log(cfg)
    return cfg
}

module.exports = {
    readConfig
}