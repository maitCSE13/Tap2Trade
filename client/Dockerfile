
FROM node:14.17.3 AS production

LABEL version="1.0"
LABEL description="This is the base docker image for the Tweet Sentiment Analysis frontend react app."
LABEL maintainer = ["tap2trade11@gmail.com", "govind,meq752dhingra@gmail.com"]

WORKDIR /app/client

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --no-optional && npm cache clean --force

COPY . .

EXPOSE 3030

CMD ["npm", "start"]