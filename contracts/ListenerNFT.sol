// SPDX-License-Identifier: UNLICENSE

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./ListenerAccessControl.sol";
import "./ListenerCollection.sol";
import "./ListenerFulfillment.sol";

contract ListenerNFT is ERC721Enumerable {
    using MintParamsLibrary for MintParamsLibrary.MintParams;

    ListenerAccessControl private _accessControl;
    ListenerCollection private _listenerCollection;
    ListenerFulfillment private _listenerFulfillment;
    uint256 private _totalSupplyCount;

    struct Token {
        uint256 tokenId;
        uint256 collectionId;
        uint256[] price;
        address acceptedToken;
        address creator;
        string uri;
        string name;
        bool isBurned;
        uint256 timestamp;
    }

    mapping(uint256 => Token) private _tokens;
    mapping(uint256 => uint256) private _fulfillerId;
    mapping(uint256 => string) private _printType;
    mapping(uint256 => uint256) private _discount;

    event BatchTokenMinted(address indexed to, uint256[] tokenIds, string uri);
    event AccessControlUpdated(
        address indexed oldAccessControl,
        address indexed newAccessControl,
        address updater
    );
    event ListenerCollectionUpdated(
        address indexed oldListenerCollection,
        address indexed newListenerCollection,
        address updater
    );
    event FulfillmentUpdated(
        address indexed oldFulfillment,
        address indexed newFulfillment,
        address updater
    );

    event TokenBurned(uint256 indexed tokenId);
    event TokenFulfillerIdUpdated(
        uint256 indexed tokenId,
        uint256 oldFulfillerId,
        uint256 newFulfillerId,
        address updater
    );

    modifier onlyAdmin() {
        require(
            _accessControl.isAdmin(msg.sender),
            "ListenerAccessControl: Only admin can perform this action"
        );
        _;
    }

    modifier onlyCreator(uint256 _tokenId) {
        require(
            msg.sender == _tokens[_tokenId].creator,
            "ListenerNFT: Only the creator can edit the fulfiller ID"
        );
        _;
    }

    modifier onlyCollectionContract() {
        require(
            msg.sender == address(_listenerCollection),
            "ListenerNFT: Only collection contract can mint tokens"
        );
        _;
    }

    constructor(
        address _accessControlAddress,
        address _fulfillmentAddress
    ) ERC721("ListenerNFT", "PRNFT") {
        _accessControl = ListenerAccessControl(_accessControlAddress);
        _listenerFulfillment = ListenerFulfillment(_fulfillmentAddress);
        _totalSupplyCount = 0;
    }

    function mintBatch(
        MintParamsLibrary.MintParams memory params,
        uint256 _amount,
        uint256 _collectionId,
        address _creatorAddress,
        address _purchaserAddress,
        address _acceptedToken
    ) public onlyCollectionContract {
        require(
            params.discount < 100,
            "ListenerMarket: Discount cannot exceed 100."
        );
        uint256[] memory tokenIds = new uint256[](_amount);
        for (uint256 i = 0; i < _amount; i++) {
            _totalSupplyCount += 1;
            _mintToken(
                params,
                _collectionId,
                _creatorAddress,
                _acceptedToken
            );
            _setMappings(params);

            tokenIds[i] = _totalSupplyCount;
            _safeMint(_purchaserAddress, _totalSupplyCount);
        }

        emit BatchTokenMinted(_purchaserAddress, tokenIds, params.uri);
    }

    function _setMappings(MintParamsLibrary.MintParams memory params) private {
        _fulfillerId[_totalSupplyCount] = params.fulfillerId;
        _printType[_totalSupplyCount] = params.printType;
        _discount[_totalSupplyCount] = params.discount;
    }

    function _mintToken(
        MintParamsLibrary.MintParams memory params,
        uint256 _collectionId,
        address _creatorAddress,
        address _acceptedToken
    ) private {
        Token memory newToken = Token({
            tokenId: _totalSupplyCount,
            collectionId: _collectionId,
            price: params.price,
            acceptedToken: _acceptedToken,
            creator: _creatorAddress,
            uri: params.uri,
            name: params.name,
            isBurned: false,
            timestamp: block.timestamp
        });

        _tokens[_totalSupplyCount] = newToken;
    }

    function burnBatch(uint256[] memory _tokenIds) public {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(
                msg.sender == ownerOf(_tokenIds[i]),
                "ERC721Metadata: Only token owner can burn tokens"
            );
        }

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            burn(_tokenIds[i]);
        }
    }

    function burn(uint256 _tokenId) public {
        require(
            msg.sender == ownerOf(_tokenId),
            "ERC721Metadata: Only token owner can burn token"
        );
        _burn(_tokenId);
        _tokens[_tokenId].isBurned = true;
        emit TokenBurned(_tokenId);
    }

    function setListenerCollection(
        address _listenerCollectionAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerCollection);
        _listenerCollection = ListenerCollection(_listenerCollectionAddress);
        emit ListenerCollectionUpdated(
            oldAddress,
            _listenerCollectionAddress,
            msg.sender
        );
    }

    function updateAccessControl(
        address _newAccessControlAddress
    ) public onlyAdmin {
        address oldAddress = address(_accessControl);
        _accessControl = ListenerAccessControl(_newAccessControlAddress);
        emit AccessControlUpdated(
            oldAddress,
            _newAccessControlAddress,
            msg.sender
        );
    }

    function updateFulfillment(
        address _newFulfillmentAddress
    ) public onlyAdmin {
        address oldAddress = address(_listenerFulfillment);
        _listenerFulfillment = ListenerFulfillment(_newFulfillmentAddress);
        emit FulfillmentUpdated(oldAddress, _newFulfillmentAddress, msg.sender);
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        return _tokens[_tokenId].uri;
    }

    function getTotalSupplyCount() public view returns (uint256) {
        return _totalSupplyCount;
    }

    function getTokenCreator(uint256 _tokenId) public view returns (address) {
        return _tokens[_tokenId].creator;
    }

    function getTokenPrice(
        uint256 _tokenId
    ) public view returns (uint256[] memory) {
        return _tokens[_tokenId].price;
    }

    function getTokenCollection(
        uint256 _tokenId
    ) public view returns (uint256) {
        return _tokens[_tokenId].collectionId;
    }

    function getTokenDiscount(uint256 _tokenId) public view returns (uint256) {
        return _discount[_tokenId];
    }

    function getTokenIsBurned(uint256 _tokenId) public view returns (bool) {
        return _tokens[_tokenId].isBurned;
    }

    function getTokenTimestamp(uint256 _tokenId) public view returns (uint256) {
        return _tokens[_tokenId].timestamp;
    }

    function getTokenId(uint256 _tokenId) public view returns (uint256) {
        return _tokens[_tokenId].tokenId;
    }

    function getTokenPrintType(
        uint256 _tokenId
    ) public view returns (string memory) {
        return _printType[_tokenId];
    }
    
    function getTokenAcceptedToken(
        uint256 _tokenId
    ) public view returns (address) {
        return _tokens[_tokenId].acceptedToken;
    }

    function getTokenName(
        uint256 _tokenId
    ) public view returns (string memory) {
        return _tokens[_tokenId].name;
    }

    function getTokenFulfillerId(
        uint256 _tokenId
    ) public view returns (uint256) {
        return _fulfillerId[_tokenId];
    }

    function setFulfillerId(
        uint256 _tokenId,
        uint256 _newFulfillerId
    ) public onlyCreator(_tokenId) {
        require(
            _listenerFulfillment.getFulfillerAddress(_newFulfillerId) !=
                address(0),
            "ListenerFulfillment: FulfillerId does not exist."
        );
        uint256 oldFulfillerId = _fulfillerId[_tokenId];
        _fulfillerId[_tokenId] = _newFulfillerId;
        emit TokenFulfillerIdUpdated(
            _tokenId,
            oldFulfillerId,
            _newFulfillerId,
            msg.sender
        );
    }

    function getAccessControlContract() public view returns (address) {
        return address(_accessControl);
    }

    function getFulfillmentContract() public view returns (address) {
        return address(_listenerFulfillment);
    }

    function getListenerCollectionContract() public view returns (address) {
        return address(_listenerCollection);
    }
}
