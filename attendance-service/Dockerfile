FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy maven executable to the image
COPY mvnw .
COPY .mvn .mvn

# Copy the pom.xml file
COPY pom.xml .

# Copy the project source
COPY common-library common-library
COPY attendance-service attendance-service
COPY auth-service auth-service

# Build all dependencies for offline use
RUN ./mvnw dependency:go-offline -B

# Package the application
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/attendance-service/target/attendance-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
