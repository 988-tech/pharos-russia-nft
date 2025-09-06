class PharosRussiaMint {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.config = null;
        this.connectionType = null; // 'injected' или 'walletconnect'
        
        // Contract ABI (минимально необходимые функции)
        this.ABI = [
            "function MINT_PRICE() view returns (uint256)",
            "function MAX_SUPPLY() view returns (uint256)",
            "function totalMinted() view returns (uint256)",
            "function mint(uint256 quantity) payable",
            "function owner() view returns (address)"
        ];
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Starting initialization...');
            
            // Проверяем загрузку Ethers.js с повторными попытками
            let ethersReady = typeof ethers !== 'undefined';
            let attempts = 0;
            
            while (!ethersReady && attempts < 10) {
                console.log(`Waiting for Ethers.js to load, attempt ${attempts + 1}/10`);
                await new Promise(resolve => setTimeout(resolve, 500));
                ethersReady = typeof ethers !== 'undefined';
                attempts++;
            }
            
            if (!ethersReady) {
                console.error('Ethers.js library failed to load after 10 attempts!');
                // Показываем более информативную ошибку
                document.getElementById('walletOptions').innerHTML = `
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>Проблема с загрузкой библиотек</h6>
                        <p class="mb-2">Web3 библиотека не загрузилась. Возможные причины:</p>
                        <ul class="mb-2">
                            <li>Проблемы с интернет-соединением</li>
                            <li>Блокировка CDN</li>
                            <li>Корпоративный фаервол</li>
                        </ul>
                        <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                            <i class="fas fa-redo me-1"></i>Обновить страницу
                        </button>
                    </div>
                `;
                return;
            }
            
            console.log('Ethers.js loaded successfully:', ethers.version);
            
            // Загружаем конфигурацию с сервера
            await this.loadConfig();
            console.log('Config loaded successfully');
            
            // Инициализируем UI
            this.initializeUI();
            console.log('UI initialized successfully');
            
            // Проверяем подключение кошелька
            await this.checkWalletConnection();
            
            // Обновляем статистику
            await this.updateStats();
            
            console.log('Initialization completed successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            // Пытаемся хотя бы инициализировать UI
            try {
                this.initializeUI();
                console.log('UI initialized as fallback');
            } catch (uiError) {
                console.error('UI initialization also failed:', uiError);
            }
        }
    }
    
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            this.config = await response.json();
            console.log('Config loaded:', this.config);
        } catch (error) {
            console.error('Failed to load config:', error);
            // Fallback конфигурация
            this.config = {
                contractAddress: "PASTE_CONTRACT_ADDRESS_HERE",
                chainId: 688688,
                chainIdHex: "0xA8230",
                rpcUrl: "https://rpc.testnet.pharos.network",
                chainName: "PHAROS Testnet",
                currency: {
                    name: "PHAROS",
                    symbol: "PHRS",
                    decimals: 18
                }
            };
        }
    }
    
    initializeUI() {
        // Элементы DOM
        this.elements = {
            connectWalletBtn: document.getElementById('connectWalletBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            walletOptions: document.getElementById('walletOptions'),
            mintBtn: document.getElementById('mintBtn'),
            mintBtnText: document.getElementById('mintBtnText'),
            walletInfo: document.getElementById('walletInfo'),
            walletAddress: document.getElementById('walletAddress'),
            networkStatus: document.getElementById('networkStatus'),
            mintQuantity: document.getElementById('mintQuantity'),
            totalCost: document.getElementById('totalCost'),
            remainingSupply: document.getElementById('remainingSupply'),
            decreaseBtn: document.getElementById('decreaseBtn'),
            increaseBtn: document.getElementById('increaseBtn'),
            statusModal: new bootstrap.Modal(document.getElementById('statusModal')),
        };
        
        // Event listeners
        this.elements.connectWalletBtn.addEventListener('click', () => this.connectWallet());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        this.elements.mintBtn.addEventListener('click', () => this.mintNFT());
        this.elements.decreaseBtn.addEventListener('click', () => this.changeQuantity(-1));
        this.elements.increaseBtn.addEventListener('click', () => this.changeQuantity(1));
        this.elements.mintQuantity.addEventListener('input', () => this.updateCost());
        
        // Слушаем изменения аккаунта и сети
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.updateWalletInfo(accounts[0], 'MetaMask');
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }
    
    detectWallet() {
        // Проверяем различные кошельки по приоритету (как на официальном сайте PHAROS)
        console.log('Detecting wallets...');
        console.log('Available global objects:', {
            okxwallet: !!window.okxwallet,
            bitkeep: !!window.bitkeep, 
            trustwallet: !!window.trustwallet,
            ethereum: !!window.ethereum
        });
        
        // Проверяем OKX Wallet (приоритет как на pharosnetwork.xyz)
        if (window.okxwallet && window.okxwallet.request) {
            console.log('OKX Wallet (dedicated okxwallet) detected');
            return { provider: window.okxwallet, name: 'OKX Wallet', icon: 'fas fa-wallet' };
        }
        
        // Проверяем Bitget Wallet
        if (window.bitkeep && window.bitkeep.request) {
            console.log('Bitget Wallet (bitkeep) detected');
            return { provider: window.bitkeep, name: 'Bitget Wallet', icon: 'fas fa-wallet' };
        }
        
        // Проверяем Trust Wallet
        if (window.trustwallet && window.trustwallet.request) {
            console.log('Trust Wallet (dedicated trustwallet) detected');
            return { provider: window.trustwallet, name: 'Trust Wallet', icon: 'fas fa-shield-alt' };
        }
        
        if (window.ethereum && window.ethereum.request) {
            console.log('Ethereum provider properties:', {
                isOkxWallet: window.ethereum.isOkxWallet,
                isBitKeep: window.ethereum.isBitKeep,
                isTrust: window.ethereum.isTrust,
                isMetaMask: window.ethereum.isMetaMask,
                providers: window.ethereum.providers?.length || 0
            });
            
            // Проверяем специфичные свойства разных кошельков
            if (window.ethereum.isOkxWallet) {
                console.log('OKX Wallet (through ethereum.isOkxWallet) detected');
                return { provider: window.ethereum, name: 'OKX Wallet', icon: 'fas fa-wallet' };
            }
            
            if (window.ethereum.isBitKeep) {
                console.log('Bitget Wallet (through ethereum.isBitKeep) detected');
                return { provider: window.ethereum, name: 'Bitget Wallet', icon: 'fas fa-wallet' };
            }
            
            if (window.ethereum.isTrust) {
                console.log('Trust Wallet (through ethereum.isTrust) detected');
                return { provider: window.ethereum, name: 'Trust Wallet', icon: 'fas fa-shield-alt' };
            }
            
            if (window.ethereum.isMetaMask) {
                console.log('MetaMask (through ethereum.isMetaMask) detected');
                return { provider: window.ethereum, name: 'MetaMask', icon: 'fab fa-ethereum' };
            }
            
            // Общий ethereum провайдер
            console.log('Generic Ethereum wallet detected');
            return { provider: window.ethereum, name: 'Web3 Wallet', icon: 'fas fa-wallet' };
        }
        
        console.log('No wallet detected');
        return null;
    }

    async checkWalletConnection() {
        try {
            console.log('Checking wallet connection...');
            
            const wallet = this.detectWallet();
            
            if (wallet) {
                console.log(`${wallet.name} detected`);
                const accounts = await wallet.provider.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    console.log(`Auto-connecting to ${wallet.name}...`);
                    // Автоматически подключаем только если уже авторизован
                    await this.connectWallet(wallet);
                } else {
                    console.log(`${wallet.name} not connected`);
                    this.updateConnectionStatus('Кошелёк не подключен', false);
                }
            } else {
                console.log('No wallet found');
                this.updateConnectionStatus('Откройте в DApp браузере кошелька', false);
            }
        } catch (error) {
            console.error('Wallet check error:', error);
            this.updateConnectionStatus('Ошибка подключения', false);
        }
    }
    
    // Удаляем старый метод connectMetaMask - теперь используем универсальный connectWallet

    async connectWallet() {
        try {
            console.log('Connect Wallet button clicked');
            
            // Устанавливаем состояние загрузки
            this.elements.connectWalletBtn.disabled = true;
            this.elements.connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Подключение...';
            
            // Определяем доступный кошелек
            const wallet = this.detectWallet();
            
            if (!wallet) {
                console.log('No wallet detected, showing instructions');
                // Показываем инструкции для установки кошелька
                this.showError('Кошелек не найден. Откройте сайт в DApp браузере вашего кошелька (OKX, Bitget, MetaMask)');
                this.resetWalletButtons();
                return;
            }
            
            console.log(`Connecting to ${wallet.name}...`);
            
            // Добавляем детальную диагностику для OKX
            if (wallet.name.includes('OKX')) {
                console.log('OKX Wallet specific diagnostics:', {
                    provider: !!wallet.provider,
                    request: !!wallet.provider.request,
                    isOkxWallet: wallet.provider.isOkxWallet,
                    version: wallet.provider.version || 'unknown'
                });
            }
            
            // Добавляем таймаут для предотвращения зависания
            const connectWithTimeout = async () => {
                console.log(`Requesting accounts from ${wallet.name}...`);
                return Promise.race([
                    wallet.provider.request({ method: 'eth_requestAccounts' }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
                    )
                ]);
            };
            
            // Запрашиваем подключение с таймаутом
            const accounts = await connectWithTimeout();
            console.log('Accounts received:', accounts);
            
            // Проверяем что ethers доступен
            if (typeof ethers === 'undefined') {
                throw new Error('Ethers.js library not loaded');
            }
            
            // Инициализируем провайдер (используем Web3Provider для ethers v5)
            this.provider = new ethers.providers.Web3Provider(wallet.provider);
            console.log('Ethers provider created');
            
            // Получаем signer
            this.signer = this.provider.getSigner();
            console.log('Signer obtained');
            this.connectionType = 'injected';
            
            // Получаем адрес
            const address = await this.signer.getAddress();
            console.log('Address obtained:', address);
            
            // Проверяем сеть
            const network = await this.provider.getNetwork();
            console.log('Network:', network.chainId);
            
            if (Number(network.chainId) !== this.config.chainId) {
                console.log('Wrong network, switching...');
                try {
                    await this.ensurePharosNetwork(wallet.provider);
                    // Пересоздаем провайдер после смены сети
                    this.provider = new ethers.providers.Web3Provider(wallet.provider);
                    this.signer = this.provider.getSigner();
                } catch (networkError) {
                    console.error('Network switch error:', networkError);
                    // Продолжаем даже если не удалось переключить сеть
                }
            }
            
            // Инициализируем контракт
            if (this.config.contractAddress !== "PASTE_CONTRACT_ADDRESS_HERE") {
                this.contract = new ethers.Contract(this.config.contractAddress, this.ABI, this.signer);
                console.log('Contract initialized');
            }
            
            // Обновляем UI
            this.updateWalletInfo(address, wallet.name);
            this.updateConnectionStatus('PHAROS Testnet', true);
            
            // Слушаем события кошелька
            try {
                if (wallet.provider.on) {
                    wallet.provider.on('accountsChanged', (accounts) => {
                        console.log('Accounts changed:', accounts);
                        if (accounts.length === 0) {
                            this.disconnectWallet();
                        } else {
                            this.updateWalletInfo(accounts[0], wallet.name);
                        }
                    });
                    
                    wallet.provider.on('chainChanged', () => {
                        console.log('Chain changed, reloading...');
                        window.location.reload();
                    });
                }
            } catch (eventError) {
                console.log('Event listener setup failed:', eventError);
                // Не критично, продолжаем
            }
            
            // Обновляем статистику
            try {
                await this.updateStats();
            } catch (statsError) {
                console.log('Stats update failed:', statsError);
                // Не критично
            }
            
            console.log(`Successfully connected to ${wallet.name}!`);
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            
            if (error.code === 4001) {
                this.showError('Подключение отклонено пользователем');
            } else if (error.message.includes('timeout')) {
                this.showError('Таймаут подключения. Попробуйте еще раз');
            } else if (error.message.includes('network')) {
                this.showError('Ошибка сети. Проверьте подключение');
            } else {
                this.showError(`Ошибка подключения: ${error.message}`);
            }
            
            // Всегда сбрасываем состояние кнопки при ошибке
            this.resetWalletButtons();
        }
    }
    
    // Удаляем старый метод connectWalletConnect - теперь используется только connectWallet
    
    async ensurePharosNetwork(provider = window.ethereum) {
        const currentChainId = await provider.request({ method: 'eth_chainId' });
        
        if (currentChainId !== this.config.chainIdHex) {
            try {
                // Пытаемся переключиться на PHAROS
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.config.chainIdHex }]
                });
            } catch (switchError) {
                // Если сети нет в кошельке, добавляем её
                if (switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: this.config.chainIdHex,
                            chainName: this.config.chainName,
                            nativeCurrency: this.config.currency,
                            rpcUrls: [this.config.rpcUrl],
                            blockExplorerUrls: []
                        }]
                    });
                } else {
                    throw switchError;
                }
            }
        }
    }
    
    async disconnectWallet() {
        try {
            console.log('Disconnecting wallet...');
            
            this.provider = null;
            this.signer = null;
            this.contract = null;
            this.connectionType = null;
            
            // Обновляем UI
            this.resetWalletButtons();
            this.elements.walletInfo.classList.add('d-none');
            this.elements.walletOptions.classList.remove('d-none');
            this.elements.mintBtn.disabled = true;
            this.elements.mintBtnText.textContent = 'Подключите кошелёк';
            this.updateConnectionStatus('Отключено', false);
            
            console.log('Wallet disconnected successfully');
            
        } catch (error) {
            console.error('Disconnect error:', error);
            // Принудительно очищаем состояние даже при ошибке
            this.provider = null;
            this.signer = null;
            this.contract = null;
            this.connectionType = null;
        }
    }
    
    resetWalletButtons() {
        this.elements.connectWalletBtn.disabled = false;
        this.elements.connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i>Connect Wallet';
    }
    
    updateWalletInfo(address, walletType = 'Unknown') {
        this.elements.walletAddress.textContent = `${walletType}: ${address.slice(0, 6)}...${address.slice(-4)}`;
        this.elements.walletInfo.classList.remove('d-none');
        this.elements.walletOptions.classList.add('d-none');
        
        // Активируем кнопку минта если контракт доступен
        if (this.contract) {
            this.elements.mintBtn.disabled = false;
            this.elements.mintBtnText.textContent = 'Минт NFT';
        } else {
            this.elements.mintBtn.disabled = true;
            this.elements.mintBtnText.textContent = 'Контракт не настроен';
        }
    }
    
    async switchToTargetNetwork(instance) {
        try {
            if (instance.isWalletConnect) {
                // Для WalletConnect запрашиваем смену сети через провайдер
                await instance.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.config.chainIdHex }]
                });
            } else {
                // Для MetaMask используем стандартный метод
                await this.ensurePharosNetwork();
            }
        } catch (error) {
            console.error('Network switch error:', error);
            if (error.code === 4902) {
                // Сеть не добавлена, добавляем её
                await this.addPharosNetwork(instance);
            } else {
                throw error;
            }
        }
    }
    
    async addPharosNetwork(instance) {
        const networkParams = {
            chainId: this.config.chainIdHex,
            chainName: this.config.chainName,
            nativeCurrency: this.config.currency,
            rpcUrls: [this.config.rpcUrl],
            blockExplorerUrls: ["https://pharos-testnet.blockscout.com/"]
        };
        
        if (instance && instance.isWalletConnect) {
            await instance.request({
                method: 'wallet_addEthereumChain',
                params: [networkParams]
            });
        } else {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkParams]
            });
        }
    }
    
    updateConnectionStatus(network, connected) {
        this.elements.networkStatus.innerHTML = connected 
            ? `<i class="fas fa-circle text-success me-1"></i>${network}`
            : `<i class="fas fa-circle text-secondary me-1"></i>${network}`;
    }
    
    changeQuantity(delta) {
        const current = parseInt(this.elements.mintQuantity.value);
        const newValue = Math.max(1, Math.min(10, current + delta));
        this.elements.mintQuantity.value = newValue;
        this.updateCost();
    }
    
    updateCost() {
        const quantity = parseInt(this.elements.mintQuantity.value) || 1;
        const totalCost = (0.1 * quantity).toFixed(1);
        this.elements.totalCost.textContent = `${totalCost} PHAROS`;
    }
    
    async updateStats() {
        if (!this.contract) {
            return;
        }
        
        try {
            const maxSupply = await this.contract.MAX_SUPPLY();
            const totalMinted = await this.contract.totalMinted();
            const remaining = maxSupply - totalMinted;
            
            this.elements.remainingSupply.textContent = remaining.toString();
            
        } catch (error) {
            console.error('Stats update error:', error);
            this.elements.remainingSupply.textContent = '—';
        }
    }
    
    async mintNFT() {
        if (!this.contract || !this.signer) {
            this.showError('Подключите кошелёк');
            return;
        }
        
        try {
            const quantity = Math.max(1, Math.min(10, parseInt(this.elements.mintQuantity.value) || 1));
            
            // Показываем модал загрузки
            this.showStatus('Подготовка транзакции...', 'loading');
            
            // Получаем цену минта
            const mintPrice = await this.contract.MINT_PRICE();
            const totalValue = mintPrice * BigInt(quantity);
            
            this.showStatus('Подтвердите транзакцию в кошельке...', 'loading');
            
            // Отправляем транзакцию
            const tx = await this.contract.mint(quantity, { 
                value: totalValue,
                gasLimit: 300000 // устанавливаем лимит газа
            });
            
            this.showStatus('Обработка транзакции...', 'loading');
            
            // Ждём подтверждения
            const receipt = await tx.wait();
            
            this.showStatus('Минт успешно завершён!', 'success');
            
            // Обновляем статистику
            await this.updateStats();
            
            setTimeout(() => {
                this.elements.statusModal.hide();
            }, 3000);
            
        } catch (error) {
            console.error('Mint error:', error);
            let errorMessage = 'Неизвестная ошибка';
            
            if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Транзакция отклонена пользователем';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Недостаточно средств для оплаты';
            } else if (error.message.includes('Sold out')) {
                errorMessage = 'Все NFT распроданы';
            } else if (error.message.includes('Mint 1-10 per tx')) {
                errorMessage = 'Можно минтить от 1 до 10 NFT за транзакцию';
            } else if (error.shortMessage) {
                errorMessage = error.shortMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showStatus(`Ошибка: ${errorMessage}`, 'error');
        }
    }
    
    showStatus(message, type = 'loading') {
        const title = document.getElementById('statusModalTitle');
        const content = document.getElementById('statusModalContent');
        
        let icon, className;
        switch (type) {
            case 'loading':
                icon = '<div class="spinner-border text-primary mb-3" role="status"></div>';
                className = '';
                title.textContent = 'Обработка';
                break;
            case 'success':
                icon = '<i class="fas fa-check-circle text-success mb-3" style="font-size: 3rem;"></i>';
                className = 'text-success';
                title.textContent = 'Успешно';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle text-danger mb-3" style="font-size: 3rem;"></i>';
                className = 'text-danger';
                title.textContent = 'Ошибка';
                break;
            case 'info':
                icon = '<i class="fas fa-info-circle text-info mb-3" style="font-size: 3rem;"></i>';
                className = 'text-info';
                title.textContent = 'Инструкция';
                break;
        }
        
        content.innerHTML = `${icon}<p class="${className}">${message}</p>`;
        this.elements.statusModal.show();
    }
    
    showError(message) {
        this.showStatus(message, 'error');
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    showMobileWalletInstructions() {
        const message = `
            <div class="text-start">
                <h6>Для подключения кошелька на мобильном:</h6>
                <div class="mb-3">
                    <strong>📱 MetaMask:</strong><br>
                    1. Откройте приложение MetaMask<br>
                    2. Нажмите на браузер (🌐)<br>
                    3. Введите адрес сайта<br><br>
                    
                    <strong>📱 OKX Wallet:</strong><br>
                    1. Откройте приложение OKX Wallet<br>
                    2. Перейдите в "Discover" или "DApps"<br>
                    3. Введите адрес сайта<br><br>
                    
                    <strong>📱 Trust Wallet:</strong><br>
                    1. Откройте Trust Wallet<br>
                    2. Нажмите на "Browser" внизу<br>
                    3. Введите адрес сайта
                </div>
                <small class="text-muted">
                    Копируйте эту ссылку:<br>
                    <code style="word-break: break-all;">${window.location.href}</code>
                </small>
            </div>
        `;
        
        this.showStatus(message, 'info');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.pharosMint = new PharosRussiaMint();
});
