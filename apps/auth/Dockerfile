# Development stage
FROM node:alpine AS development

WORKDIR /usr/src/app

# Copy package and lock files
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json
COPY apps/auth/prisma ./prisma

# Use the existing yarn installation
RUN yarn install

# Run Prisma generate to generate Prisma client
RUN npx prisma generate

# Copy application source code
COPY apps/auth apps/auth

# Install dependencies for the auth app
RUN cd apps/auth && yarn install

# Build the auth application
RUN yarn run build auth

# Production stage
FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Copy package files again for production
COPY package.json ./
COPY yarn.lock ./

# Use the existing yarn installation
RUN yarn install --production

# Copy the built code from the development stage
COPY --from=development /usr/src/app/dist ./dist

# Start the application in production mode
CMD ["yarn", "run", "start:prod", "dist/apps/auth/main"]
