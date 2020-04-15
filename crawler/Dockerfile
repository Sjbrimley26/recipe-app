FROM node:10 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i --production
COPY src/ .

FROM node:10
EXPOSE 3000
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
CMD ["node", "main"]