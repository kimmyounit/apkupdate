FROM node:20-alpine

WORKDIR /app

# Salin dependencies manifest
COPY package*.json ./

# Install dependencies (termasuk devDependencies untuk build Vite)
RUN npm install --legacy-peer-deps

# Salin seluruh kode proyek
COPY . .

# Build Vite production assets
RUN npm run build

# Port default server TAMVESTA
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Jalankan server Express
CMD ["npm", "start"]
