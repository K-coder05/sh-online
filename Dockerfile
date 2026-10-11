# Self-hosting image: builds the frontend and backend, then serves both from
# one Java process so the whole game lives at a single URL.
# See SELF_HOSTING.md.

FROM node:18 AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Same-origin mode: the page talks to whatever host it was loaded from.
ENV REACT_APP_SAME_ORIGIN=true
RUN npm run build

FROM eclipse-temurin:17-jdk AS backend
WORKDIR /app/backend
COPY backend/ ./
RUN chmod +x gradlew && ./gradlew jar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend /app/backend/build/libs/secret-hitler-online.jar ./secret-hitler-online.jar
COPY --from=frontend /app/frontend/build ./public
ENV PORT=8080 \
    STATIC_FILES_DIR=/app/public
EXPOSE 8080
# Exec form so the JVM receives SIGTERM and its shutdown hook backs up lobbies.
CMD ["java", "-jar", "/app/secret-hitler-online.jar"]
