const express = require('express')
const {ChatGPTPuppeteer} = require("./browser");
const app = express()
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

app.use(express.json())
global.ppt = new ChatGPTPuppeteer()
global.count = 0
ppt.init().then(res => {
    console.log('browser inited')
    setInterval(() => {
        ppt.cleanCookies().then(() => {
            console.log('clean cookies')
        }).catch(err => {
            console.error(err)
        })
    }, 1000 * 60 * 10)
})
app.get('/turing/conversation/create', async function (req, res) {
    async function getRes() {
        let bRes
        if (config.proxy.cf) {
            let cookits = await ppt.getCookies()
            let cookie = cookits.map(ck => `${ck.name}=${ck.value};`).join('')
            bRes = await ppt.sendRequest(config.proxy.cf + '/https://www.bing.com/turing/conversation/create', 'get', null, {
                Cookie: cookie
            })
        } else {
            bRes = await ppt.sendRequest('https://www.bing.com/turing/conversation/create', 'get')
        }
        return bRes
    }

    let bRes = await getRes()
    let retry = 3
    while (retry > 0 && !bRes.headers && !bRes.conversationId) {
        bRes = await getRes()
        retry--
    }
    let bHeaders = bRes.headers
    if (bHeaders) {
        count++
        if (count > 30) {
            // the same MUID cannot send too many request, or got `throttled` from bing
            ppt.cleanCookies()
            global.count = 0
        }
        for (let key of Object.keys(bHeaders)) {
            res.setHeader(key, bHeaders[key])
        }
        // res.setHeader('content-type', 'application/json')
        res.removeHeader('content-encoding')
        res.send(JSON.stringify(bRes.body))
    } else {
        ppt.cleanCookies()
        res.status(500)
        res.send("error")
    }
})

app.get('/cookies', async function (req, res) {
    let cookits = await ppt.getCookies()
    res.send(cookits)
})

app.get('/clean-cookies', async (req, res) => {
    await ppt.cleanCookies()
    res.send({
        success: true
    })
})

app.listen(port, () => {
    console.log(`bing conversation creator listening on port ${port}`)
});