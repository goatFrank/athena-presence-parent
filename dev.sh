#!/bin/bash

# Ottieni la directory radice del progetto
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🚀 ATHENA DEVELOPMENT SUITE"
echo "---------------------------"

# 1. Carichiamo l'ambiente Rust/Cargo se presente (necessario per Tauri)
if [ -f "$HOME/.cargo/env" ]; then
  source "$HOME/.cargo/env"
fi

# 2. Avviamo SEMPRE l'infrastruttura backend (Microservizi Java, DB e Redis)
echo "📦 Passo 1: Avvio Microservizi & Database (Docker)..."
docker compose up -d attendance-service auth-service redis

echo ""
echo "Quale interfaccia vuoi lanciare?"
echo "1) 🖥️  App Desktop (Tauri) - Consigliato per sviluppo desktop"
echo "2) 🌐 Web App (Browser) - Versione containerizzata standard"
echo "3) 🚀 Combo (Desktop + Browser) - Avvia entrambi contemporaneamente"
read -p "Scegli un'opzione (1/2/3): " choice

case $choice in
  1)
    echo "Fermando il container frontend per evitare conflitti sulla porta 5173..."
    docker compose stop frontend
    echo "Avvio Tauri..."
    cd "$DIR/frontend" && npm run tauri dev
    ;;
  2)
    echo "Avvio container frontend via Docker..."
    docker compose start frontend
    echo "✨ Athena Web App pronta su http://localhost:5173"
    ;;
  3)
    echo "Preparazione modalità Combo..."
    # Fermiamo il container frontend perché useremo il server Vite 'nativo' 
    # che è più veloce ed è lo stesso usato da Tauri.
    docker compose stop frontend
    echo "Avvio server di sviluppo e apertura browser..."
    
    # Avviamo Tauri in background
    (cd "$DIR/frontend" && npm run tauri dev) &
    
    # Aspettiamo che il server Vite si scaldi prima di aprire il browser
    sleep 5
    open "http://localhost:5173"
    
    # Mantiene il terminale occupato finché l'app non viene chiusa
    wait
    ;;
  *)
    echo "Scelta non valida. Esco senza avviare il frontend."
    ;;
esac
