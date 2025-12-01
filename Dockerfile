FROM apify/actor-node:22

# Copy package files
COPY --chown=myuser:myuser package*.json ./

# Install dependencies
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages"

# Copy source code
COPY --chown=myuser:myuser . ./

# Run
CMD npm start --silent
