FROM node:18.8-alpine as base

RUN apk update
RUN apk add
RUN apk add ffmpeg

FROM base as builder

WORKDIR /home/node/app
COPY package*.json ./

COPY . .
RUN npm install
RUN npm run build

FROM base as runtime

WORKDIR /home/node/app
COPY package*.json  ./

RUN npm install --production
COPY --from=builder /home/node/app/dist ./dist

CMD ["node", "dist/server.js"]
