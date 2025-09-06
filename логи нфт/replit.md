# Pharos Russia NFT Minting Platform

## Overview

This is a complete NFT minting platform for the "Pharos Russia" collection built on the PHAROS blockchain testnet. The project combines a Solidity smart contract with a Flask web application to enable users to mint NFTs through a user-friendly web interface. The platform supports minting 10,000 unique NFTs at 0.1 PHAROS each, with integrated wallet connectivity and real-time blockchain interaction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Flask's Jinja2 templating system serves HTML pages
- **Styling Framework**: Bootstrap 5.3.0 for responsive UI components with custom CSS for branding
- **JavaScript Framework**: Vanilla JavaScript with Ethers.js v6.13.2 for blockchain interactions
- **Web3 Integration**: Direct browser wallet integration using MetaMask/WalletConnect protocols
- **Real-time Updates**: Client-side JavaScript polling for contract state and user interface updates

### Backend Architecture
- **Web Framework**: Flask (Python) serving as a lightweight API and static file server
- **Route Structure**: RESTful endpoints for health checks, configuration delivery, and static asset serving
- **Environment Configuration**: Environment variables for sensitive data like contract addresses and RPC endpoints
- **Session Management**: Flask sessions with configurable secret keys
- **Logging**: Python's built-in logging module configured for debugging

### Smart Contract Architecture
- **Standard**: ERC-721 (Non-Fungible Token) implementation using OpenZeppelin contracts
- **Access Control**: Ownable pattern for administrative functions like baseURI updates and fund withdrawal
- **Supply Management**: Hard-coded maximum supply of 10,000 tokens with atomic counter tracking
- **Pricing Model**: Fixed price of 0.1 PHAROS per mint with bulk minting support
- **Metadata Strategy**: Base URI + token ID + ".json" pattern for off-chain metadata storage

### Blockchain Integration
- **Target Network**: PHAROS Testnet (Chain ID: 688688)
- **Development Framework**: Hardhat for smart contract compilation, testing, and deployment
- **Wallet Support**: MetaMask and other Web3 wallets through standardized provider detection
- **Transaction Handling**: Ethers.js for contract interaction, transaction signing, and event monitoring

### Data Storage Strategy
- **Metadata Storage**: Designed for IPFS or Replit static file hosting
- **Contract State**: On-chain storage for essential minting data (supply, price, ownership)
- **Configuration Management**: Server-side JSON API for dynamic contract address and network configuration
- **Static Assets**: Local file system serving CSS, JavaScript, and potential metadata files

## External Dependencies

### Blockchain Infrastructure
- **PHAROS Testnet RPC**: Primary blockchain connectivity via https://rpc.testnet.pharos.network
- **MetaMask/Web3 Wallets**: User authentication and transaction signing
- **Ethers.js Library**: Browser-based blockchain interaction library from CDN

### Development and Deployment Tools
- **Hardhat**: Ethereum development environment for contract compilation and deployment
- **OpenZeppelin Contracts**: Audited smart contract library for ERC-721 implementation
- **Node.js Environment**: Required for Hardhat toolchain and smart contract development

### Frontend Libraries and Frameworks
- **Bootstrap 5.3.0**: UI component library served from CDN
- **Font Awesome 6.4.0**: Icon library for user interface elements
- **Flask Framework**: Python web framework for backend API and templating

### Optional Services
- **IPFS**: Decentralized storage option for NFT metadata and images
- **Replit Hosting**: Platform-specific hosting for metadata files and application deployment
- **Environment Variable Management**: Configuration through Replit secrets or .env files