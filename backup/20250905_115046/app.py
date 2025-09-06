import os
import logging
from flask import Flask, render_template, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "pharos-russia-nft-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

@app.route('/')
def index():
    """Main page for NFT minting"""
    return render_template('index.html')

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Pharos Russia NFT Minting"})

@app.route('/api/config')
def config():
    """API endpoint to get contract configuration"""
    config_data = {
        "contractAddress": os.environ.get("CONTRACT_ADDRESS", "PASTE_CONTRACT_ADDRESS_HERE"),
        "chainId": 688688,
        "chainIdHex": "0xA8230",
        "rpcUrl": os.environ.get("PHAROS_RPC", "https://rpc.testnet.pharos.network"),
        "chainName": "PHAROS Testnet",
        "currency": {
            "name": "PHAROS",
            "symbol": "PHRS",
            "decimals": 18
        }
    }
    return jsonify(config_data)

@app.route('/metadata/<int:token_id>')
def metadata(token_id):
    """Serve NFT metadata for given token ID"""
    if token_id < 1 or token_id > 10000:
        return jsonify({"error": "Invalid token ID"}), 404
    
    # Get the base URL for images
    base_url = f"{request.scheme}://{request.host}"
    
    metadata = {
        "name": f"Pharos Russia #{token_id}",
        "description": "Эксклюзивный NFT-бейдж для российских пользователей блокчейна PHAROS. Символ принадлежности к инновационному сообществу децентрализованных технологий. Присоединяйтесь к нашему сообществу: https://t.me/hrumdrops",
        "image": f"{base_url}/static/images/pharosRussia.jpg",
        "external_url": "https://t.me/hrumdrops",
        "attributes": [
            {
                "trait_type": "Edition",
                "value": "Pharos Russia"
            },
            {
                "trait_type": "Country",
                "value": "Russia"
            },
            {
                "trait_type": "Blockchain",
                "value": "PHAROS"
            },
            {
                "trait_type": "Rarity",
                "value": "Exclusive"
            },
            {
                "trait_type": "Token ID",
                "value": token_id
            },
            {
                "trait_type": "Community",
                "value": "HrumDrops"
            }
        ]
    }
    
    return jsonify(metadata)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
