# LINE Smart Home Controller Add-on

🤖 **LINE Bot 智能家居控制器** - 直接整合到 Home Assistant 的 Add-on

## ✨ 功能特色

- 🏠 **原生 HA 整合** - 直接運行在 Home Assistant 上，無需額外硬體
- 🤖 **中文語音控制** - 支援自然語言，如「打開客廳燈」「關閉電風扇」
- 🔍 **自動設備發現** - 自動掃描所有可控制的設備，無需手動配置
- 📱 **LINE Bot 整合** - 使用客戶自己的 LINE Bot，完全私有化
- 🔐 **資料隱私** - 所有控制命令只在客戶家中處理，不經過第三方
- ⚡ **即時回應** - 本地處理，延遲 < 100ms
- 🎛️ **Ingress 介面** - 直接在 HA 中管理和監控

## 📱 支援設備類型

- 💡 **燈光設備** (light.*) - 開關、調光、色溫
- 🔌 **開關設備** (switch.*) - 插座、開關
- 🏠 **窗簾設備** (cover.*) - 開啟、關閉、停止
- ❄️ **空調設備** (climate.*) - 開關、溫度調節
- 📺 **媒體設備** (media_player.*) - 開關、音量

## 🚀 安裝步驟

### 1. 添加 Add-on Repository
在 Home Assistant 中：
1. 進入 **設定** → **Add-ons** → **Add-on Store**
2. 點擊右上角 **⋮** → **Repositories**
3. 添加此 Repository URL: `https://github.com/calvinastroboy/line-ha-addon-repo`

### 2. 安裝 Add-on
1. 在 Add-on Store 中找到 **LINE Smart Home Controller**
2. 點擊 **INSTALL**
3. 等待安裝完成

### 3. 配置 LINE Bot

#### 申請 LINE Bot 憑證
1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 建立 Provider 和 Messaging API Channel
3. 取得 **Channel Access Token** 和 **Channel Secret**

#### 配置 Add-on
在 Add-on 設定頁面填入：
```yaml
line_channel_access_token: "你的_Channel_Access_Token"
line_channel_secret: "你的_Channel_Secret"
webhook_path: "/webhook"
log_level: "info"
```

### 4. 設定外網訪問

使用 FRP 內網穿透，將 Webhook URL 設為：
```
https://your-domain.com/webhook
```

### 5. 啟動服務
1. 點擊 **START** 啟動 Add-on
2. 啟用 **Auto-start** 開機自動啟動
3. 檢查 **Log** 確認運行狀態
4. 點擊 **Open Web UI** 查看管理介面

## 📱 使用方式

### 控制指令範例
```
列表              → 顯示所有可控制設備
打開客廳燈         → 客廳燈開啟
關閉電風扇         → 電風扇關閉
切換窗簾          → 窗簾開關狀態切換
開冷氣            → 空調開啟
關投影            → 投影設備關閉
```

## 🔧 故障排除

### Add-on 無法啟動
檢查 **Log** 頁面，常見問題：
- LINE 憑證未設定或錯誤
- Home Assistant API 連線失敗

### LINE Bot 無回應
1. 檢查 Webhook URL 是否可外網訪問
2. 確認 FRP 隧道狀態
3. 查看 Add-on Logs 確認收到 Webhook

### 設備控制無效
1. 確認設備在 Home Assistant 中可正常控制
2. 檢查設備名稱是否包含特殊字符
3. 確認設備狀態更新正常

## 📊 API 端點

- `GET /` - Web 管理介面（Ingress）
- `POST /webhook` - LINE Bot Webhook
- `GET /health` - 健康檢查
- `GET /devices` - 設備列表 API
- `GET /test-ha` - HA 連線測試

## 📞 支援

- **GitHub Issues**: [Report Bug](https://github.com/calvinastroboy/line-ha-addon-repo/issues)
- **Email**: calvin@xiaoyan.io

---

**小燕科技** - 專業智能家居解決方案