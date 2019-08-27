FROM node:10-slim

# Create app directory
WORKDIR /server/

# Bundle app source
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY . /server/

# Install app dependencies
RUN npm install && npm run build

EXPOSE 5000
CMD [ "npm", "start" ]