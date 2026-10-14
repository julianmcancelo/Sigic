#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de Configuración del Punto de Acceso Wi-Fi Autónomo (SiGIC Hotspot)
# ==============================================================================

echo "=== Configurando Punto de Acceso Wi-Fi Autónomo de SiGIC ==="

# 1. Instalar herramientas de red si no están presentes
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y hostapd dnsmasq wireless-tools iw iptables avahi-daemon

# 2. Desactivar servicios por defecto hasta configurarlos
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true

# 3. Detectar la interfaz inalámbrica principal (wlan0, wlp2s0, etc.)
WIFI_IFACE=$(iw dev | awk '$1=="Interface"{print $2}' | head -n 1)

if [ -z "$WIFI_IFACE" ]; then
  WIFI_IFACE="wlan0"
  echo "Aviso: No se detectó interfaz Wi-Fi activa inmediatamente; usando $WIFI_IFACE por defecto."
fi

echo "Interfaz Wi-Fi seleccionada: $WIFI_IFACE"

# 4. Asignar IP estática a la interfaz Wi-Fi (Subred 192.168.50.1/24)
cat << EOF > /etc/network/interfaces.d/sigic-wifi
auto $WIFI_IFACE
iface $WIFI_IFACE inet static
    address 192.168.50.1
    netmask 255.255.255.0
EOF

# 5. Configurar dnsmasq (Servidor DHCP y DNS local offline)
cat << EOF > /etc/dnsmasq.d/sigic-hotspot.conf
# Servidor DHCP autónomo para SiGIC
interface=$WIFI_IFACE
dhcp-range=192.168.50.10,192.168.50.150,255.255.255.0,24h

# Dominio local autónomo
domain=sigic.local
address=/sigic.local/192.168.50.1
address=/colacion.sigic/192.168.50.1
address=/inicio/192.168.50.1

# Portal cautivo opcional (redirigir peticiones comunes a la IP de SiGIC)
address=/connectivitycheck.gstatic.com/192.168.50.1
address=/clients3.google.com/192.168.50.1
address=/msftconnecttest.com/192.168.50.1
EOF

# 6. Configurar hostapd (Punto de Acceso Wi-Fi WPA2)
cat << EOF > /etc/hostapd/hostapd.conf
interface=$WIFI_IFACE
driver=nl80211
ssid=SiGIC - Evento Colacion
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=sigic2026
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|g' /etc/default/hostapd 2>/dev/null || true

# 7. Crear servicio systemd para levantar el hotspot automáticamente al detectar placa Wi-Fi
cat << 'EOF' > /etc/systemd/system/sigic-hotspot.service
[Unit]
Description=SiGIC Punto de Acceso Wi-Fi Autonomo
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/iniciar-sigic-hotspot.sh

[Install]
WantedBy=multi-user.target
EOF

# 8. Script que levanta el hotspot validando que exista hardware Wi-Fi
cat << 'EOF' > /usr/local/bin/iniciar-sigic-hotspot.sh
#!/bin/bash
WIFI_IFACE=$(iw dev 2>/dev/null | awk '$1=="Interface"{print $2}' | head -n 1)

if [ -n "$WIFI_IFACE" ]; then
  echo "Iniciando punto de acceso Wi-Fi en $WIFI_IFACE..."
  sed -i "s/^interface=.*/interface=$WIFI_IFACE/" /etc/hostapd/hostapd.conf
  sed -i "s/^interface=.*/interface=$WIFI_IFACE/" /etc/dnsmasq.d/sigic-hotspot.conf
  
  ip link set $WIFI_IFACE down
  ip addr flush dev $WIFI_IFACE
  ip addr add 192.168.50.1/24 dev $WIFI_IFACE
  ip link set $WIFI_IFACE up
  
  systemctl restart dnsmasq
  systemctl restart hostapd
  echo "Punto de acceso 'SiGIC - Evento Colacion' activo en 192.168.50.1"
else
  echo "No se detecto placa Wi-Fi física; omitiendo inicio de hotspot."
fi
EOF

chmod +x /usr/local/bin/iniciar-sigic-hotspot.sh
systemctl enable sigic-hotspot.service 2>/dev/null || true

echo "¡Punto de acceso Wi-Fi autónomo configurado con éxito!"
