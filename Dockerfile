FROM node:16

USER root

RUN apt-get update

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3100

CMD ["npm","start"]