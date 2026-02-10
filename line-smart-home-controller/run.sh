#!/usr/bin/with-contenv bashio

bashio::log.info "Starting LINE Smart Home Controller Add-on..."

# Check required configuration
if ! bashio::config.has_value 'line_channel_access_token'; then
    bashio::log.warning "LINE Channel Access Token not configured!"
    bashio::log.info "Please configure LINE Bot credentials in Add-on settings"
fi

if ! bashio::config.has_value 'line_channel_secret'; then
    bashio::log.warning "LINE Channel Secret not configured!"  
    bashio::log.info "Please configure LINE Bot credentials in Add-on settings"
fi

# Display configuration
bashio::log.info "Webhook path: $(bashio::config 'webhook_path')"
bashio::log.info "Log level: $(bashio::config 'log_level')"

# Check Supervisor Token
if [[ -z "${SUPERVISOR_TOKEN}" ]]; then
    bashio::log.error "SUPERVISOR_TOKEN environment variable not set!"
    bashio::exit.nok
fi

bashio::log.info "Home Assistant API connection ready"

# Test network connection
if curl -f -s http://supervisor/core/api/ -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" > /dev/null; then
    bashio::log.info "HA API connection test successful"
else
    bashio::log.warning "HA API connection test failed, but continuing startup"
fi

# Start Node.js application
bashio::log.info "Starting Node.js server..."
cd /app
exec node app.js