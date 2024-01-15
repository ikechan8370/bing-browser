# Bing proxy by puppeteer

Use different client identifier and ip address (through proxy) to create bing chat conversation without authentication and captcha.

In this way, the conversation length is limited to 10. You can stash history conversation into one or sidebar context to continue chat after 10 rounds. 

## Usage
Create a config file named config.toml, and just `node index.js`. 

Change env `PORT` to change the listening port, `3000` by default.

Then you can send a get request without any cookie to `http://localhost:3000/turing/conversation/create` and get the conversation.

## Proxy
You can set proxy in config file, the puppeteer will load bing home page with this proxy.

If cf proxy not set, it will directly send create conversation request to www_bing_com with proxy.

To ensure ip not banned by microsoft, you can use a dynamic proxy, which uses different ip address for each request. 

Or you can implement your cf proxy by yourself, this project will send request to your cf proxy in the format of `https://[domain]/<real_url>`. What your proxy should do contains: 
1. Receive http requests and forward them to the target server
2. Ensure that the request header is also forwarded
3. In this usage scenario, you only need to adapt the Get method
4. Must be in https:// schema, because the browser will block http request sent from an origin or https sites such as bing chat page. 

It's recommended to implement it in pure javascript so that you can deploy it in some serverless environment such as Cloudflare workers, in which case it will automatically use random IP for each request. Notice, if cf workers used, the ip chosen by workers depends on the location you send your request by default, so you can send request to workers with proxy from different locations to get a larger worldwide proxy pool. And DO NOT abuse these free serverless environments, please.

## Notice

1. This project only implement conversation create endpoint, other endpoint such as websocket and image upload, image create should be implemented by yourself or just request directly.
2. If you don't use edge, the conversation length limit will be 5 instead.
3. Requests to cf proxy will also be sent through proxy if set.

## Todo
1. Global lock for cookie refresh.
2. Custom proxy provider with per page per proxy.