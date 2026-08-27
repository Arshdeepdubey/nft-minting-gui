// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title VoucherNFT
/// @notice ERC-721 with lazy minting: users redeem a backend-signed voucher
///         (tied to a "win") to mint their NFT directly, paying their own gas.
contract VoucherNFT is ERC721URIStorage, EIP712, Ownable {
    using ECDSA for bytes32;

    string private constant SIGNING_DOMAIN = "VoucherNFT-Voucher";
    string private constant SIGNATURE_VERSION = "1";

    /// @notice address allowed to sign vouchers (rotatable by owner)
    address public minterSigner;

    /// @notice tracks redeemed voucher ids to prevent double mint
    mapping(uint256 => bool) public redeemed;

    struct Voucher {
        uint256 tokenId;
        address recipient;
        string uri;
        uint256 expiresAt; // unix timestamp, 0 = no expiry
        bytes signature;
    }

    event VoucherRedeemed(uint256 indexed tokenId, address indexed recipient);
    event MinterSignerUpdated(address indexed newSigner);

    constructor(address initialOwner, address initialSigner)
        ERC721("VoucherNFT", "VNFT")
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
        Ownable(initialOwner)
    {
        minterSigner = initialSigner;
    }

    function setMinterSigner(address newSigner) external onlyOwner {
        minterSigner = newSigner;
        emit MinterSignerUpdated(newSigner);
    }

    /// @notice Redeem a signed voucher and mint the NFT to msg.sender.
    /// @dev msg.sender must match voucher.recipient; caller pays gas.
    function redeem(Voucher calldata voucher) external {
        require(msg.sender == voucher.recipient, "VoucherNFT: not recipient");
        require(!redeemed[voucher.tokenId], "VoucherNFT: already redeemed");
        require(
            voucher.expiresAt == 0 || block.timestamp <= voucher.expiresAt,
            "VoucherNFT: voucher expired"
        );

        address signer = _verify(voucher);
        require(signer == minterSigner, "VoucherNFT: invalid signature");

        redeemed[voucher.tokenId] = true;
        _safeMint(voucher.recipient, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.uri);

        emit VoucherRedeemed(voucher.tokenId, voucher.recipient);
    }

    function _verify(Voucher calldata voucher) internal view returns (address) {
        bytes32 digest = _hashVoucher(voucher);
        return digest.recover(voucher.signature);
    }

    function _hashVoucher(Voucher calldata voucher) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "Voucher(uint256 tokenId,address recipient,string uri,uint256 expiresAt)"
                        ),
                        voucher.tokenId,
                        voucher.recipient,
                        keccak256(bytes(voucher.uri)),
                        voucher.expiresAt
                    )
                )
            );
    }

    /// @notice Exposes the EIP-712 domain separator components for frontend/backend signing.
    function eip712Domain712()
        external
        view
        returns (string memory name, string memory version, uint256 chainId, address verifyingContract)
    {
        return (SIGNING_DOMAIN, SIGNATURE_VERSION, block.chainid, address(this));
    }
}
