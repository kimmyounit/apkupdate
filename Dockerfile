FROM node:20-alpine

WORKDIR /app

# Salin dependencies manifest
COPY package*.json ./

# Install dependencies (termasuk devDependencies untuk build Vite)
RUN npm install

# Salin seluruh kode proyek
COPY . .

# Build Vite production assets
RUN npm run build

# Port default yang diharapkan Koyeb / Cloud
EXPOSE 8000
ENV PORT=8000
ENV NODE_ENV=production

# Jalankan server Express
CMD ["npm", "start"]
