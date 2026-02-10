const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const fs = require('fs');

const app = express();

// 讀取 Add-on 配置
const CONFIG_PATH = '/data/options.json';
let config = {
  line_channel_access_token: '',
  line_channel_secret: '', 
  webhook_path: '/webhook',
  log_level: 'info'
};

// 如果存在配置檔案，讀取配置
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    console.log('✅ Add-on 配置載入成功');
  } catch (error) {
    console.error('❌ 無法讀取配置檔案:', error.message);
  }
} else {
  console.warn('⚠️  配置檔案不存在，使用預設配置');
}

// Home Assistant Supervisor API
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_URL = 'http://supervisor/core/api';

console.log(`🏠 HA API: ${HA_URL}`);
console.log(`🔑 Supervisor Token: ${SUPERVISOR_TOKEN ? '已設定' : '未設定'}`);

// LINE Bot 配置
const lineConfig = {
  channelAccessToken: config.line_channel_access_token,
  channelSecret: config.line_channel_secret,
};

let client;
if (config.line_channel_access_token && config.line_channel_secret) {
  client = new line.Client(lineConfig);
  console.log('🤖 LINE Bot 客戶端初始化成功');
} else {
  console.warn('⚠️  LINE 憑證未配置，請在 Add-on 設定中填入 Channel Access Token 和 Channel Secret');
}

// HA API 呼叫函數
async function callHAAPI(endpoint, method = 'GET', data = null) {
  const url = `${HA_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const config = { method, url, headers };
    if (data && method !== 'GET') {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ HA API 錯誤 ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// 獲取所有可控制的設備
async function getControllableDevices() {
  try {
    console.log('🔍 正在掃描可控制設備...');
    const states = await callHAAPI('/states');
    
    const devices = {
      lights: [],
      switches: [],
      covers: [],
      climate: [],
      media_players: []
    };
    
    states.forEach(entity => {
      const [domain] = entity.entity_id.split('.');
      const name = entity.attributes.friendly_name || entity.entity_id;
      
      switch (domain) {
        case 'light':
          devices.lights.push({ entity_id: entity.entity_id, name, state: entity.state });
          break;
        case 'switch':
          devices.switches.push({ entity_id: entity.entity_id, name, state: entity.state });
          break;
        case 'cover':
          devices.covers.push({ entity_id: entity.entity_id, name, state: entity.state });
          break;
        case 'climate':
          devices.climate.push({ entity_id: entity.entity_id, name, state: entity.state });
          break;
        case 'media_player':
          devices.media_players.push({ entity_id: entity.entity_id, name, state: entity.state });
          break;
      }
    });
    
    console.log(`📊 發現設備: 燈光${devices.lights.length} 開關${devices.switches.length} 窗簾${devices.covers.length} 空調${devices.climate.length} 媒體${devices.media_players.length}`);
    return devices;
  } catch (error) {
    console.error('❌ 獲取設備清單失敗:', error.message);
    return { lights: [], switches: [], covers: [], climate: [], media_players: [] };
  }
}

// 中文指令解析
async function parseCommand(text) {
  text = text.trim().toLowerCase();
  console.log(`🗣️  解析指令: "${text}"`);
  
  // 獲取所有設備
  const devices = await getControllableDevices();
  const allDevices = [
    ...devices.lights,
    ...devices.switches, 
    ...devices.covers,
    ...devices.climate,
    ...devices.media_players
  ];
  
  // 操作類型
  let action = null;
  if (text.includes('打開') || text.includes('開啟') || text.includes('開')) {
    action = 'turn_on';
  } else if (text.includes('關閉') || text.includes('關')) {
    action = 'turn_off';
  } else if (text.includes('切換') || text.includes('開關')) {
    action = 'toggle';
  }
  
  if (!action) {
    console.log('❌ 未識別到操作類型');
    return null;
  }
  
  // 智能匹配設備名稱
  for (const device of allDevices) {
    const deviceName = device.name.toLowerCase();
    const entityId = device.entity_id.toLowerCase();
    const shortName = entityId.split('.')[1];
    
    if (text.includes(deviceName) || text.includes(shortName)) {
      const [domain] = device.entity_id.split('.');
      console.log(`✅ 匹配設備: ${device.name} (${device.entity_id})`);
      return {
        entity_id: device.entity_id,
        deviceName: device.name,
        action,
        domain
      };
    }
  }
  
  console.log('❌ 未找到匹配的設備');
  return null;
}

// 執行設備控制
async function executeDeviceControl(command) {
  const { entity_id, deviceName, action, domain } = command;
  
  try {
    console.log(`🎮 執行控制: ${deviceName} (${action})`);
    
    let service = action;
    
    // 特殊領域的服務映射
    if (domain === 'cover') {
      service = action === 'turn_on' ? 'open_cover' : 
               action === 'turn_off' ? 'close_cover' : 'toggle';
    }
    
    await callHAAPI(`/services/${domain}/${service}`, 'POST', {
      entity_id: entity_id
    });
    
    // 稍等片刻再獲取狀態
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const states = await callHAAPI(`/states/${entity_id}`);
    const stateText = states.state === 'on' || states.state === 'open' ? '已開啟' : 
                      states.state === 'off' || states.state === 'closed' ? '已關閉' : 
                      `狀態: ${states.state}`;
    
    console.log(`✅ 控制成功: ${deviceName} ${stateText}`);
    return `✅ ${deviceName}${stateText}`;
    
  } catch (error) {
    console.error(`❌ 控制失敗: ${error.message}`);
    return `❌ 控制失敗: ${error.message}`;
  }
}

// LINE 訊息處理
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;
  console.log('📱 收到訊息:', userMessage);

  try {
    // 特殊指令
    if (userMessage === '列表' || userMessage === '設備列表' || userMessage === '狀態') {
      const devices = await getControllableDevices();
      
      let message = '🏠 可控制設備:\n\n';
      
      if (devices.lights.length > 0) {
        message += '💡 燈光設備:\n';
        devices.lights.slice(0, 10).forEach(d => {
          message += `• ${d.name} (${d.state})\n`;
        });
        message += '\n';
      }
      
      if (devices.switches.length > 0) {
        message += '🔌 開關設備:\n';
        devices.switches.slice(0, 10).forEach(d => {
          message += `• ${d.name} (${d.state})\n`;
        });
        message += '\n';
      }
      
      if (devices.covers.length > 0) {
        message += '🏠 窗簾設備:\n';
        devices.covers.slice(0, 5).forEach(d => {
          message += `• ${d.name} (${d.state})\n`;
        });
        message += '\n';
      }
      
      if (devices.climate.length > 0) {
        message += '❄️ 空調設備:\n';
        devices.climate.slice(0, 5).forEach(d => {
          message += `• ${d.name} (${d.state})\n`;
        });
        message += '\n';
      }
      
      message += '💡 說法範例:\n「打開客廳燈」\n「關閉電風扇」\n「切換窗簾」';
      
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: message
      });
    }

    // 解析控制指令
    const command = await parseCommand(userMessage);
    
    if (command) {
      const result = await executeDeviceControl(command);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: result
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🤔 我不太理解你的指令\n\n請試試:\n• 打開客廳燈\n• 關閉電風扇\n• 切換窗簾\n\n或回覆「列表」查看所有設備'
      });
    }
  } catch (error) {
    console.error('❌ 處理訊息錯誤:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 系統暫時無法回應，請稍後再試'
    });
  }
}

// Webhook 路由
if (client) {
  app.post(config.webhook_path, line.middleware(lineConfig), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result))
      .catch((err) => {
        console.error('❌ Webhook 錯誤:', err);
        res.status(500).end();
      });
  });
  console.log(`🔗 Webhook 路由已設定: ${config.webhook_path}`);
} else {
  console.warn('⚠️  LINE 客戶端未初始化，Webhook 功能不可用');
}

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    addon: 'LINE Smart Home Controller',
    time: new Date().toISOString(),
    line_configured: !!(config.line_channel_access_token && config.line_channel_secret),
    supervisor_token: !!SUPERVISOR_TOKEN
  });
});

// Ingress 主頁
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>LINE Smart Home Controller</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .status.ok { background: #d4edda; color: #155724; }
        .status.warning { background: #fff3cd; color: #856404; }
        .status.error { background: #f8d7da; color: #721c24; }
        h1 { color: #333; }
        .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .code { background: #f1f1f1; padding: 5px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 LINE Smart Home Controller</h1>
        
        <div class="status ${config.line_channel_access_token ? 'ok' : 'warning'}">
            <strong>LINE Bot 狀態:</strong> ${config.line_channel_access_token ? '✅ 已配置' : '⚠️ 未配置'}
        </div>
        
        <div class="status ${SUPERVISOR_TOKEN ? 'ok' : 'error'}">
            <strong>HA API 連線:</strong> ${SUPERVISOR_TOKEN ? '✅ 正常' : '❌ 異常'}
        </div>
        
        <div class="info">
            <h3>📱 使用方式</h3>
            <p>1. 配置 LINE Bot 憑證（Channel Access Token & Secret）</p>
            <p>2. 設定 FRP Client 外網訪問</p>
            <p>3. 在 LINE 中傳送指令控制設備：</p>
            <ul>
                <li><span class="code">列表</span> - 查看所有設備</li>
                <li><span class="code">打開客廳燈</span> - 開啟燈光</li>
                <li><span class="code">關閉電風扇</span> - 關閉設備</li>
                <li><span class="code">切換窗簾</span> - 切換狀態</li>
            </ul>
        </div>
        
        <div class="info">
            <h3>🔗 API 端點</h3>
            <p><strong>Webhook:</strong> <span class="code">${config.webhook_path}</span></p>
            <p><strong>健康檢查:</strong> <span class="code">/health</span></p>
            <p><strong>設備列表:</strong> <span class="code">/devices</span></p>
        </div>
    </div>
</body>
</html>`;
  
  res.send(html);
});

// 測試 HA 連線
app.get('/test-ha', async (req, res) => {
  try {
    const result = await callHAAPI('/');
    res.json({ status: 'ok', message: 'Home Assistant 連線正常', data: result });
  } catch (error) {
    res.json({ status: 'error', message: error.message });
  }
});

// 獲取設備清單（API）
app.get('/devices', async (req, res) => {
  try {
    const devices = await getControllableDevices();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LINE Smart Home Controller Add-on 啟動！`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🔗 Webhook: ${config.webhook_path}`);
  console.log(`🏠 HA API: ${HA_URL}`);
  console.log(`🤖 LINE 配置: ${config.line_channel_access_token ? '✅ 已設定' : '❌ 未設定'}`);
  console.log(`📊 Ingress URL: http://supervisor/ingress/line-smart-home-controller`);
});