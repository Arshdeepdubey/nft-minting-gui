// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTCollection
/// @notice Admin-minted ERC-1155 collection. The admin batch-mints tokens on
///         chain, then off-chain (backend) records ownership/assignment and
///         later transfers/mints tokens to winning users.
contract NFTCollection is ERC1155, ERC1155Supply, ERC1155Pausable, Ownable {
    string public name;
    string public symbol;

    /// @notice per-token metadata URI overrides (falls back to base `uri()` if unset)
    mapping(uint256 => string) private _tokenURIs;

    event TokenURIUpdated(uint256 indexed id, string uri);

    constructor(
        address initialOwner,
        string memory name_,
        string memory symbol_,
        string memory baseUri_
    ) ERC1155(baseUri_) Ownable(initialOwner) {
        name = name_;
        symbol = symbol_;
    }

    /// @notice Admin-only batch mint of one or more token ids to a recipient.
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Admin-only single-id mint (convenience wrapper around mintBatch).
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external onlyOwner {
        _mint(to, id, amount, data);
    }

    /// @notice Set a per-token metadata URI (overrides the base URI for that id).
    function setTokenURI(uint256 id, string memory newUri) external onlyOwner {
        _tokenURIs[id] = newUri;
        emit TokenURIUpdated(id, newUri);
    }

    /// @notice Returns the metadata URI for a token, falling back to the base URI.
    function uri(uint256 id) public view override returns (string memory) {
        string memory tokenUri = _tokenURIs[id];
        if (bytes(tokenUri).length > 0) {
            return tokenUri;
        }
        return super.uri(id);
    }

    /// @notice Pause all token transfers/mints (safety switch).
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause token transfers/mints.
    function unpause() external onlyOwner {
        _unpause();
    }

    // The following overrides are required by Solidity for multiple inheritance.
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply, ERC1155Pausable) {
        super._update(from, to, ids, values);
    }
}
