#!/usr/bin/with-contenv bashio

bashio::log.info "🚀 開始啟動 LINE Smart Home Controller Add-on..."

# 檢查必要的配置
if ! bashio::config.has_value 'line_channel_access_token'; then
    bashio::log.warning "⚠️ LINE Channel Access Token 未設定！"
    bashio::log.info "請到 Add-on 設定頁面填入 LINE Bot 憑證"
fi

if ! bashio::config.has_value 'line_channel_secret'; then
    bashio::log.warning "⚠️ LINE Channel Secret 未設定！"  
    bashio::log.info "請到 Add-on 設定頁面填入 LINE Bot 憑證"
fi

# 顯示配置資訊
bashio::log.info "📝 Webhook 路徑: $(bashio::config 'webhook_path')"
bashio::log.info "📊 日誌級別: $(bashio::config 'log_level')"

# 檢查 Supervisor Token
if [[ -z "${SUPERVISOR_TOKEN}" ]]; then
    bashio::log.error "❌ SUPERVISOR_TOKEN 環境變數未設定！"
    bashio::exit.nok
fi

bashio::log.info "🏠 Home Assistant API 連線準備就緒"

# 檢查網路連接
if curl -f -s http://supervisor/core/api/ -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" > /dev/null; then
    bashio::log.info "✅ HA API 連線測試成功"
else
    bashio::log.warning "⚠️ HA API 連線測試失敗，但繼續啟動"
fi

# 啟動 Node.js 應用程式
bashio::log.info "🎯 正在啟動 Node.js 伺服器..."
cd /app
exec node app.js