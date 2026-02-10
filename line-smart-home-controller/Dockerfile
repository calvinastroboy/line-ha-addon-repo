ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.3
FROM $BUILD_FROM

# 設定 shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# 設定工作目錄
WORKDIR /app

# 複製應用程式檔案
COPY package*.json ./
COPY app.js ./
COPY run.sh ./

# 安裝依賴
RUN npm ci --only=production \
    && npm cache clean --force

# 設定權限
RUN chmod +x run.sh

# Labels
LABEL \
    io.hass.name="LINE Smart Home Controller" \
    io.hass.description="LINE Bot 智能家居控制器" \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Calvin <calvin@xiaoyan.io>" \
    org.opencontainers.image.title="LINE Smart Home Controller" \
    org.opencontainers.image.description="LINE Bot 智能家居控制器" \
    org.opencontainers.image.vendor="小燕科技" \
    org.opencontainers.image.authors="Calvin <calvin@xiaoyan.io>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/calvinastroboy/line-ha-addon-repo"

CMD ["./run.sh"]