ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
FROM $BUILD_FROM

# 設定環境變量
ARG BUILD_ARCH
ARG BUILD_VERSION

# 設定 shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# 安裝 Node.js 和 npm
RUN apk add --no-cache \
    nodejs \
    npm \
    curl

# 設定工作目錄
WORKDIR /app

# 複製 package.json 先安裝依賴（利用 Docker 快取）
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm ci --only=production \
    && npm cache clean --force

# 複製應用程式檔案
COPY app.js ./
COPY run.sh ./

# 設定權限
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