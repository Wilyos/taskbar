# Dockerfile para despliegue en Railway o Docker
FROM node:20-alpine

# Instalar dependencias necesarias para sqlite3 si se compila
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear carpeta de datos persistente
RUN mkdir -p /app/data

# Exponer el puerto predeterminado (Railway inyecta $PORT)
ENV PORT=3000
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
