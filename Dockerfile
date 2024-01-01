FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y wget

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt-get install -yf ./google-chrome-stable_current_amd64.deb && \
    rm google-chrome-stable_current_amd64.deb

ADD . /app

WORKDIR /app

RUN npm install -g pnpm && pnpm i

RUN apt-get clean ; \
    		rm -rf /var/cache/* /var/log/apt/* /var/lib/apt/lists/* /tmp/*

ENV executablePath=/usr/bin/microsoft-edge

EXPOSE 3000

CMD ["node", "index.js"]


