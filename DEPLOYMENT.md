# Deployment Guide

This guide covers deploying the Digital Commerce Platform to various environments.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Docker (optional, for containerized deployment)
- Git

## Development Setup

### Local Development

```bash
# 1. Clone and install dependencies
git clone <repo>
cd digital-commerce-platform
npm install

# 2. Create .env file
cp .env.example .env

# 3. Configure database
# Edit .env with your local PostgreSQL connection

# 4. Run migrations
npm run migrate

# 5. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Environment Variables

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db-host:5432/commerce_db
ADMIN_JWT_SECRET=<generate-random-secret>
TENANT_JWT_SECRET=<generate-random-secret>
BCRYPT_ROUNDS=12
PLUGIN_DIR=/app/plugins
FILE_UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=104857600
REDIS_URL=redis://redis-host:6379
```

Generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Build for Production

```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist

# Create volumes
RUN mkdir -p /app/plugins /app/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: commerce
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: commerce_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U commerce"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://commerce:${DB_PASSWORD}@postgres:5432/commerce_db
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      TENANT_JWT_SECRET: ${TENANT_JWT_SECRET}
      REDIS_URL: redis://redis:6379
      PLUGIN_DIR: /app/plugins
      FILE_UPLOAD_DIR: /app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - plugins_data:/app/plugins
      - uploads_data:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  plugins_data:
  uploads_data:
```

### nginx Configuration

```nginx
# nginx.conf
upstream app {
  server app:3000;
}

server {
  listen 80;
  server_name *.commerce.example.com commerce.example.com;

  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name *.commerce.example.com commerce.example.com;

  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

  client_max_body_size 100M;

  location / {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Static files caching
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

## AWS Deployment

### Using Elastic Beanstalk

#### .ebextensions/nodecommand.config
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    
commands:
  01_migrate:
    command: "npm run migrate"
    leader_only: true
```

#### .ebextensions/postgres.config
```yaml
option_settings:
  aws:rds:db:
    DBEngine: postgres
    DBEngineVersion: 15.1
    DBInstanceClass: db.t3.micro
    DBUser: commerce
    DBPassword: ${DB_PASSWORD}
    AllocatedStorage: 20
```

### Deploy to Beanstalk

```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Initialize
eb init -p node.js-18 commerce-platform

# Create environment
eb create production-env

# Deploy
eb deploy

# View logs
eb logs
```

### Using ECS

#### task-definition.json
```json
{
  "family": "commerce-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/commerce:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/commerce-platform",
          "awslogs-region": "region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Kubernetes Deployment

### Dockerfile (optimized for K8s)

```dockerfile
FROM node:18-alpine as builder

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /build/dist ./dist

RUN mkdir -p /app/plugins /app/uploads

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Kubernetes Manifests

#### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: commerce-platform
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: commerce-platform
  template:
    metadata:
      labels:
        app: commerce-platform
    spec:
      containers:
      - name: app
        image: your-registry/commerce:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database
              key: url
        - name: ADMIN_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: secrets
              key: admin-jwt
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: plugins
          mountPath: /app/plugins
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: plugins
        persistentVolumeClaim:
          claimName: plugins-pvc
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
```

#### service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: commerce-platform
spec:
  type: LoadBalancer
  selector:
    app: commerce-platform
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: commerce-platform
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - commerce.example.com
    - "*.commerce.example.com"
    secretName: commerce-tls
  rules:
  - host: commerce.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: commerce-platform
            port:
              number: 80
  - host: "*.commerce.example.com"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: commerce-platform
            port:
              number: 80
```

## Database Backup & Recovery

### Backup Script

```bash
#!/bin/bash
# backup.sh

DB_HOST=${1:-localhost}
DB_USER=${2:-commerce}
DB_NAME=${3:-commerce_db}
BACKUP_DIR=${4:-./backups}

mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### Restore Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_HOST=${2:-localhost}
DB_USER=${3:-commerce}
DB_NAME=${4:-commerce_db}

gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

echo "Restore completed from: $BACKUP_FILE"
```

## Monitoring & Logging

### Application Logging

```bash
# View logs
docker logs -f container_name

# With timestamps
docker logs -f --timestamps container_name

# Last 100 lines
docker logs -f --tail 100 container_name
```

### Health Monitoring

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Database Monitoring

```bash
# Connect to database
psql -h localhost -U commerce -d commerce_db

# View active connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

# View slow queries (enable logging first)
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Scaling Considerations

1. **Horizontal Scaling**: Run multiple application instances with load balancer
2. **Database Connection Pooling**: Use PgBouncer or similar
3. **Caching**: Use Redis for session and data caching
4. **File Storage**: Use S3 or similar for file uploads
5. **CDN**: Use CloudFront or similar for static assets
6. **Queue System**: Use Bull or RabbitMQ for async jobs

## Security Hardening

1. **SSL/TLS**: Always use HTTPS in production
2. **Environment Variables**: Never commit secrets to git
3. **Database**: Use strong passwords, enable SSL connections
4. **Firewall**: Restrict database access to application servers
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **CORS**: Configure CORS properly for your domains
7. **CSP**: Set Content Security Policy headers
8. **Security Headers**: Add security headers with Helmet

## Performance Optimization

1. **Database Indexes**: Ensure proper indexing
2. **Connection Pooling**: Configure appropriate pool size
3. **Caching**: Enable Redis caching
4. **Compression**: Enable gzip compression
5. **CDN**: Use CDN for static assets
6. **Load Testing**: Test with tools like Apache JMeter

## Troubleshooting

### Cannot connect to database
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# View logs
docker logs app
```

### Migration failures
```bash
# Check migration status
npm run migrate

# Rollback manually if needed
npm run migrate:down
```

### High memory usage
```bash
# Check memory usage
docker stats

# Restart container
docker restart container_name
```

## Support

For deployment support, contact support@example.com or check documentation.
