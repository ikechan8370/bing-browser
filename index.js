const express = require('express')
const {ChatGPTPuppeteer} = require("./browser");
const app = express()
const port = 3000
const compression = require('compression');


app.use(express.json())
// app.use(compression({ brotli: { quality: 11 } }));
global.ppt = new ChatGPTPuppeteer()
ppt.init().then(res => {
    console.log('browser inited')
})
app.get('/turing/conversation/create', async function (req, res) {
    let bRes
    if (process.env.CF_PROXY) {
        let cookits = await ppt.getCookies()
        let cookie = cookits.map(ck => `${ck.name}=${ck.value};`).join('')
        bRes = await ppt.sendRequest(process.env.CF_PROXY + '/https://www.bing.com/turing/conversation/create', 'get', null, {
            Cookie: cookie
        })
    } else {
        bRes = await ppt.sendRequest('https://www.bing.com/turing/conversation/create', 'get')
    }
    let bHeaders = bRes.headers
    if (bHeaders) {
        for (let key of Object.keys(bHeaders)) {
            res.setHeader(key, bHeaders[key])
        }
        // res.setHeader('content-type', 'application/json')
        res.removeHeader('content-encoding')
        res.send(JSON.stringify(bRes.body))
    } else {
        res.status(500)
    }
})

app.get('/cookies', async function (req, res) {
    let cookits = await ppt.getCookies()
    res.send(cookits)
})

app.listen(port, () => {
    console.log(`node-chatgpt-proxy listening on port ${port}`)
});