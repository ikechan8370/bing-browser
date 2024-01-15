const lodash = require('lodash');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const delay = require('delay')
const {v4: uuidv4} = require('uuid')
const {readConfig} = require("./config");
const chatUrl = 'https://www.bing.com/chat'
let puppeteer = {}

class Puppeteer {
    constructor() {
        readConfig()
        let args = [
            '--exclude-switches',
            '--no-sandbox',
            '--remote-debugging-port=51777',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--ignore-certificate-errors',
            '--no-first-run',
            '--no-service-autorun',
            '--password-store=basic',
            '--system-developer-mode',
            '--mute-audio',
            '--disable-default-apps',
            '--no-zygote',
            '--disable-accelerated-2d-canvas',
            '--disable-web-security',
            '--window-size=800,600',
            // '--headless',
            // '--proxy-server=http://127.0.0.1:7890'

            // '--shm-size=1gb'
        ]
        if (config.puppeteer.headless) {
            args.push('--headless')
        }
        if (config.proxy.proxy) {
            args.push(`--proxy=${config.proxy.proxy}`)
        }
        if (process.env.DISPLAY) {
            args.push(`--display=${process.env.DISPLAY}`)
        }
        this.browser = false
        this.lock = false
        this.config = {
            headless: false,
            args
        }
        let path = config.puppeteer.executable_path || "C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe"
        this.config.executablePath = path
    }

    async initPupp() {
        if (!lodash.isEmpty(puppeteer)) return puppeteer
        puppeteer = (await import('puppeteer-extra')).default
        const pluginStealth = StealthPlugin()
        puppeteer.use(pluginStealth)
        return puppeteer
    }

    /**
     * 初始化chromium
     */
    async browserInit() {
        await this.initPupp()
        if (this.browser) return this.browser
        if (this.lock) return false
        this.lock = true

        console.log('chatgpt puppeteer 启动中...')
        const browserURL = 'http://127.0.0.1:51777'
        try {
            this.browser = await puppeteer.connect({browserURL})
        } catch (e) {
            /** 初始化puppeteer */
            this.browser = await puppeteer.launch(this.config).catch((err) => {
                console.error(err.toString())
                if (String(err).includes('correct Chromium')) {
                    console.error('没有正确安装Chromium，可以尝试执行安装命令：node ./node_modules/puppeteer/install.js')
                }
            })
        }
        this.lock = false

        if (!this.browser) {
            console.error('chatgpt puppeteer 启动失败')
            return false
        }

        console.log('chatgpt puppeteer 启动成功')

        /** 监听Chromium实例是否断开 */
        this.browser.on('disconnected', (e) => {
            console.info('Chromium实例关闭或崩溃！')
            this.browser = false
        })

        return this.browser
    }
}

class ChatGPTPuppeteer extends Puppeteer {
    constructor(opts = {}) {
        super()
        const {
            debug = false,
        } = opts

        this._debug = !!debug
    }

    async getBrowser() {
        if (this.browser) {
            return this.browser
        } else {
            return await this.browserInit()
        }
    }

    async init() {
        console.info('init chatgpt browser')
        try {
            this.browser = await this.getBrowser()
            this._page =
                (await this.browser.pages())[0] || (await this.browser.newPage())
            await this._page.setCacheEnabled(false)
            // await this._page.setRequestInterception(true);
            if (config.proxy.proxy && config.proxy.username && config.proxy.password) {
                await this._page.authenticate({
                    username: config.proxy.username,
                    password: config.proxy.password
                })
            }
            await this._page.goto(chatUrl, {
                waitUntil: 'networkidle2'
            })

        } catch (err) {
            if (this.browser) {
                await this.browser.close()
            }

            this.browser = null
            this._page = null

            throw err
        }

        return true
    }

    async getCookies() {
        return await this._page.cookies()
    }

    async cleanCookies() {
        const client = await this._page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');
        //await this._page.deleteCookie();
        await this._page.reload()
    }

    async sendRequest(
        url, method, body, newHeaders
    ) {

        const result = await this._page.evaluate(
            browserNormalFetch,
            url,
            newHeaders,
            body,
            method
        )

        console.log('<<< EVALUATE', result)

        return result
    }

    async close() {
        if (this.browser) {
            await this.browser.close()
        }
        this._page = null
        this.browser = null
    }
}

async function browserNormalFetch(url, headers, body, method) {
    try {
        console.log({url})
        const res = await fetch(url, {
            method,
            body: method.toLowerCase() !== 'get' ? JSON.stringify(body) : undefined,
            headers: headers
        })
        let responseHeaders = {}
        res.headers.forEach((v, k) => {
            responseHeaders[k] = v
        })
        let result = {
            status: res.status,
            statusText: res.statusText,
            body: await res.json(),
            headers: responseHeaders
        }
        if (res.status !== 200) {
            result.error = {
                message: result.body.detail.message,
                statusCode: res.status,
                statusText: res.statusText
            }
        }
        return result
    } catch (err) {
        return {
            error: err.message
        }
    }


}


module.exports = {ChatGPTPuppeteer}