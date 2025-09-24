FROM node:15-alpine

WORKDIR /usr/src/app/
COPY package.json .
RUN npm install
COPY index.js .
ADD lib lib

CMD [ "node", "index.js" ]
