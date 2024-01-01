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
    let bRes = await ppt.sendRequest('https://www.bing.com/turing/conversation/create', 'get')
    let bHeaders = bRes.headers
    for (let key of Object.keys(bHeaders)) {
        res.setHeader(key, bHeaders[key])
    }
    // res.setHeader('content-type', 'application/json')
    res.removeHeader('content-encoding')
    res.send(JSON.stringify(bRes.body))
})

app.listen(port, () => {
    console.log(`node-chatgpt-proxy listening on port ${port}`)
});