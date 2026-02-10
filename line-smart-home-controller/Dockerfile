ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
FROM $BUILD_FROM

# Environment variables
ARG BUILD_ARCH
ARG BUILD_VERSION

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install Node.js and dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    curl

# Set working directory  
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install Node.js dependencies using modern syntax
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy application files
COPY app.js ./
COPY run.sh ./

# Set permissions
RUN chmod +x run.sh

# 建立非特權用戶（可選，簡化版先移除）
# RUN addgroup -g 1001 -S nodejs \
#     && adduser -S nodejs -u 1001 \
#     && chown -R nodejs:nodejs /app
# USER nodejs

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Labels
LABEL \
    io.hass.name="LINE Smart Home Controller" \
    io.hass.description="LINE Bot 智能家居控制器" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version="${BUILD_VERSION}" \
    maintainer="Calvin <calvin@xiaoyan.io>"

# 啟動指令
CMD ["./run.sh"]