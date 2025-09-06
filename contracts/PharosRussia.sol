// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PharosRussia
 * @notice Простая коллекция ERC-721 для PHAROS с фиксированной ценой и лимитом.
 *         Токены используют baseURI + tokenId + ".json".
 */
contract PharosRussia is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 10000;           // общее количество
    uint256 public constant MINT_PRICE = 0.1 ether;       // 0.1 PHAROS (18 decimals)

    uint256 public totalMinted;                           // счётчик минта
    string private baseURI;

    event Minted(address indexed minter, uint256 indexed tokenId);

    constructor() ERC721("Pharos Russia", "PHRU") Ownable(msg.sender) {}

    // === mint ===
    function mint(uint256 quantity) external payable {
        require(quantity > 0 && quantity <= 10, "Mint 1-10 per tx");
        require(totalMinted + quantity <= MAX_SUPPLY, "Sold out");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = ++totalMinted; // начинается с 1
            _safeMint(msg.sender, tokenId);
            emit Minted(msg.sender, tokenId);
        }
    }

    // === админ ===
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function withdraw(address payable to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    // === view ===
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string(abi.encodePacked(base, tokenId.toString(), ".json")) : "";
    }
}
