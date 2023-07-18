// SPDX-License-Identifier: UNLICENSE

import "./ListenerAccessControl.sol";
import "./ListenerMarket.sol";
import "./ListenerNFT.sol";
import "./ListenerFulfillment.sol";
import "./ListenerPayment.sol";

pragma solidity ^0.8.9;

library MintParamsLibrary {
    struct MintParams {
        uint256[] price;
        uint256 fulfillerId;
        uint256 discount;
        string name;
        string uri;
        string printType;
    }
}

contract ListenerCollection {
    using MintParamsLibrary for MintParamsLibrary.MintParams;

    ListenerNFT private _listenerNFT;
    ListenerFulfillment private _listenerFulfillment;
    ListenerAccessControl private _accessControl;
    ListenerPayment private _listenerPayment;
    ListenerMarket private _listenerMarket;
    uint256 private _collectionSupply;
    string public symbol;
    string public name;

    struct Collection {
        uint256[] price;
        uint256[] tokenIds;
        uint256 collectionId;
        uint256 amount;
        uint256 timestamp;
        uint256 mintedTokens;
        uint256 index;
        address creator;
        string uri;
        string name;
        bool isDeleted;
        bool noLimit;
    }

    mapping(uint256 => Collection) private _collections;
    mapping(uint256 => uint256) private _fulfillerId;
    mapping(uint256 => string) private _printType;
    mapping(uint256 => uint256) private _discount;

    event TokensMinted(
        uint256 indexed collectionId,
        string uri,
        uint256 amountMinted,
        uint256[] tokenIdsMinted,
        address owner
    );

    event CollectionCreated(
        uint256 indexed collectionId,
        string uri,
        uint256 amount,
        address owner
    );

    event CollectionDeleted(address sender, uint256 indexed collectionId);

    event CollectionAdded(
        uint256 indexed collectionId,
        uint256 amount,
        address owner
    );

    event CollectionURIUpdated(
        uint256 indexed collectionId,
        string oldURI,
        string newURI,
        address updater
    );

    event CollectionPriceUpdated(
        uint256 indexed collectionId,
        uint256[] oldPrice,
        uint256[] newPrice,
        address updater
    );

    event AccessControlUpdated(
        address indexed oldAccessControl,
        address indexed newAccessControl,
        address updater
    );

    event ListenerNFTUpdated(
        address indexed oldListenerNFT,
        address indexed newListenerNFT,
        address updater
    );

    event ListenerFulfillmentUpdated(
        address indexed oldListenerFulfillment,
        address indexed newListenerFulfillment,
        address updater
    );

    event ListenerPaymentUpdated(
        address indexed oldListenerPayment,
        address indexed newListenerPayment,
        address updater
    );

    event ListenerMarketUpdated(
        address indexed oldListenerMarket,
        address indexed newListenerMarket,
        address updater
    );

    event CollectionFulfillerIdUpdated(
        uint256 indexed collectionId,
        uint256 oldFulfillerId,
        uint256 newFulfillerId,
        address updater
    );

    event CollectionPrintTypeUpdated(
        uint256 indexed collectionId,
        string oldPrintType,
        string newPrintType,
        address updater
    );

    event CollectionNameUpdated(
        uint256 indexed collectionId,
        string oldName,
        string newName,
        address updater
    );

    event CollectionDiscountUpdated(
        uint256 indexed collectionId,
        uint256 discount,
        address updater
    );

    modifier onlyAdmin() {
        require(
            _accessControl.isAdmin(msg.sender),
            "ListenerAccessControl: Only admin can perform this action"
        );
        _;
    }

    modifier onlyCreator(uint256 _collectionId) {
        require(
            msg.sender == _collections[_collectionId].creator,
            "ListenerCollection: Only the creator can edit this collection"
        );
        _;
    }

    modifier onlyMarket() {
        require(
            msg.sender == address(_listenerMarket),
            "ListenerCollection: Only the market contract can call purchase"
        );
        _;
    }

    constructor(
        address _listenerNFTAddress,
        address _accessControlAddress,
        address _listenerPaymentAddress,
        string memory _symbol,
        string memory _name
    ) {
        _listenerNFT = ListenerNFT(_listenerNFTAddress);
        _accessControl = ListenerAccessControl(_accessControlAddress);
        _listenerPayment = ListenerPayment(_listenerPaymentAddress);
        _collectionSupply = 0;
        symbol = _symbol;
        name = _name;
    }

    function createCollection(
        uint256 _amount,
        MintParamsLibrary.MintParams memory params,
        bool _noLimit
    ) external {
        address _creator = msg.sender;
        require(
            _accessControl.isAdmin(_creator),
            "ListenerCollection: Only admin can perform this action"
        );
        require(
            _listenerFulfillment.getFulfillerAddress(params.fulfillerId) !=
                address(0),
            "ListenerFulfillment: FulfillerId does not exist."
        );

        _collectionSupply++;

        if (_noLimit) {
            _amount = type(uint256).max;
        }

        _createNewCollection(params, _amount, _creator, _noLimit);

        _setMappings(params);

        emit CollectionCreated(
            _collectionSupply,
            params.uri,
            _amount,
            _creator
        );
    }

    function addToExistingCollection(
        uint256 _collectionId,
        uint256 _amount
    ) external {
        address _creator = msg.sender;
        require(
            _collections[_collectionId].amount != type(uint256).max,
            "ListenerCollection: Collection cannot be added to."
        );

        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted"
        );
        require(
            _collections[_collectionId].collectionId != 0,
            "ListenerCollection: Collection does not exist"
        );

        require(
            _accessControl.isAdmin(_creator),
            "ListenerCollection: Only admin can perform this action"
        );
        require(
            _collections[_collectionId].creator == _creator,
            "ListenerCollection: Only the owner of a collection can add to it."
        );

        _collections[_collectionId].amount += _amount;

        emit CollectionAdded(_collectionId, _amount, _creator);
    }

    function _setMappings(MintParamsLibrary.MintParams memory params) private {
        _printType[_collectionSupply] = params.printType;
        _fulfillerId[_collectionSupply] = params.fulfillerId;
        _discount[_collectionSupply] = params.discount;
    }

    function _createNewCollection(
        MintParamsLibrary.MintParams memory params,
        uint256 _amount,
        address _creatorAddress,
        bool _noLimit
    ) private {
        Collection memory newCollection = Collection({
            collectionId: _collectionSupply,
            price: params.price,
            index: 0,
            tokenIds: new uint256[](0),
            amount: _amount,
            mintedTokens: 0,
            creator: _creatorAddress,
            uri: params.uri,
            name: params.name,
            isDeleted: false,
            noLimit: _noLimit,
            timestamp: block.timestamp
        });

        _collections[_collectionSupply] = newCollection;
    }

    function _mintNFT(
        Collection memory _collection,
        uint256 _amount,
        address _creatorAddress,
        address _purchaserAddress,
        address _acceptedToken
    ) private {
        MintParamsLibrary.MintParams memory paramsNFT = MintParamsLibrary
            .MintParams({
                price: _collection.price,
                uri: _collection.uri,
                printType: _printType[_collection.collectionId],
                fulfillerId: _fulfillerId[_collection.collectionId],
                discount: _discount[_collection.collectionId],
                name: _collection.name
            });

        _listenerNFT.mintBatch(
            paramsNFT,
            _amount,
            _collectionSupply,
            _creatorAddress,
            _purchaserAddress,
            _acceptedToken
        );
    }

    function purchaseAndMintToken(
        uint256 _collectionId,
        uint256 _amount,
        address _purchaserAddress,
        address _acceptedToken
    ) external onlyMarket {
        require(
            _listenerPayment.checkIfAddressVerified(_acceptedToken),
            "ListenerPayment: Not a valid accepted purchase token."
        );

        Collection storage collection = _collections[_collectionId];

        require(
            !collection.isDeleted,
            "ListenerCollection: This collection has been deleted."
        );
        require(
            collection.amount == type(uint256).max ||
                collection.mintedTokens + _amount <= collection.amount,
            "ListenerCollection: Cannot mint more than collection amount"
        );

        uint256 initialSupply = _listenerNFT.getTotalSupplyCount();

        _mintNFT(
            _collections[_collectionId],
            _amount,
            collection.creator,
            _purchaserAddress,
            _acceptedToken
        );

        uint256[] memory newTokenIds = new uint256[](_amount);
        for (uint256 i = 0; i < _amount; i++) {
            uint256 tokenId = initialSupply + i + 1;
            newTokenIds[i] = tokenId;
            collection.mintedTokens++;
        }

        collection.tokenIds = _concatenate(collection.tokenIds, newTokenIds);

        emit TokensMinted(
            collection.collectionId,
            collection.uri,
            _amount,
            newTokenIds,
            collection.creator
        );
    }

    function _concatenate(
        uint256[] memory _originalArray,
        uint256[] memory _newArray
    ) internal pure returns (uint256[] memory) {
        uint256[] memory result = new uint256[](
            _originalArray.length + _newArray.length
        );
        uint256 i;
        for (i = 0; i < _originalArray.length; i++) {
            result[i] = _originalArray[i];
        }
        for (uint256 j = 0; j < _newArray.length; j++) {
            result[i++] = _newArray[j];
        }
        return result;
    }

    function deleteCollection(
        uint256 _collectionId
    ) public onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has already been deleted."
        );

        Collection storage collection = _collections[_collectionId];

        if (collection.mintedTokens == 0) {
            delete _collections[_collectionId];
        } else {
            collection.amount = collection.mintedTokens;
        }
        collection.isDeleted = true;

        emit CollectionDeleted(msg.sender, _collectionId);
    }

    function updateAccessControl(
        address _newAccessControlAddress
    ) external onlyAdmin {
        address oldAddress = address(_accessControl);
        _accessControl = ListenerAccessControl(_newAccessControlAddress);
        emit AccessControlUpdated(
            oldAddress,
            _newAccessControlAddress,
            msg.sender
        );
    }

    function updateListenerNFT(
        address _newListenerNFTAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerNFT);
        _listenerNFT = ListenerNFT(_newListenerNFTAddress);
        emit ListenerNFTUpdated(oldAddress, _newListenerNFTAddress, msg.sender);
    }

    function updateListenerPayment(
        address _newListenerPaymentAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerPayment);
        _listenerPayment = ListenerPayment(_newListenerPaymentAddress);
        emit ListenerPaymentUpdated(
            oldAddress,
            _newListenerPaymentAddress,
            msg.sender
        );
    }

    function setListenerMarket(
        address _newListenerMarketAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerMarket);
        _listenerMarket = ListenerMarket(_newListenerMarketAddress);
        emit ListenerMarketUpdated(
            oldAddress,
            _newListenerMarketAddress,
            msg.sender
        );
    }

    function setListenerFulfillment(
        address _newListenerFulfillmentAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerFulfillment);
        _listenerFulfillment = ListenerFulfillment(
            _newListenerFulfillmentAddress
        );
        emit ListenerFulfillmentUpdated(
            oldAddress,
            _newListenerFulfillmentAddress,
            msg.sender
        );
    }

    function getCollectionCreator(
        uint256 _collectionId
    ) public view returns (address) {
        return _collections[_collectionId].creator;
    }

    function getCollectionURI(
        uint256 _collectionId
    ) public view returns (string memory) {
        return _collections[_collectionId].uri;
    }

    function getCollectionAmount(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _collections[_collectionId].amount;
    }

    function getCollectionNoLimit(
        uint256 _collectionId
    ) public view returns (bool) {
        return _collections[_collectionId].noLimit;
    }

    function getCollectionPrice(
        uint256 _collectionId
    ) public view returns (uint256[] memory) {
        return _collections[_collectionId].price;
    }

    function getCollectionIsDeleted(
        uint256 _collectionId
    ) public view returns (bool) {
        return _collections[_collectionId].isDeleted;
    }

    function getCollectionTimestamp(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _collections[_collectionId].timestamp;
    }

    function getCollectionFulfillerId(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _fulfillerId[_collectionId];
    }

    function getCollectionPrintType(
        uint256 _collectionId
    ) public view returns (string memory) {
        return _printType[_collectionId];
    }

    function getCollectionIndex(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _collections[_collectionId].index;
    }

    function getCollectionName(
        uint256 _collectionId
    ) public view returns (string memory) {
        return _collections[_collectionId].name;
    }

    function getCollectionTokenIds(
        uint256 _collectionId
    ) public view returns (uint256[] memory) {
        return _collections[_collectionId].tokenIds;
    }

    function getCollectionDiscount(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _discount[_collectionId];
    }

    function getCollectionTokensMinted(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _collections[_collectionId].mintedTokens;
    }

    function setCollectionPrintType(
        string memory _newPrintType,
        uint256 _collectionId
    ) external onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );

        string memory oldPrintType = _printType[_collectionId];
        _printType[_collectionId] = _newPrintType;
        emit CollectionPrintTypeUpdated(
            _collectionId,
            oldPrintType,
            _newPrintType,
            msg.sender
        );
    }

    function setCollectionName(
        string memory _newName,
        uint256 _collectionId
    ) external onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );

        string memory oldName = _collections[_collectionId].name;
        _collections[_collectionId].name = _newName;
        emit CollectionNameUpdated(
            _collectionId,
            oldName,
            _newName,
            msg.sender
        );
    }

    function setCollectionFulfillerId(
        uint256 _newFulfillerId,
        uint256 _collectionId
    ) external onlyCreator(_collectionId) {
        require(
            _listenerFulfillment.getFulfillerAddress(_newFulfillerId) !=
                address(0),
            "ListenerFulfillment: FulfillerId does not exist."
        );

        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );
        uint256 oldFufillerId = _fulfillerId[_collectionId];
        _fulfillerId[_collectionId] = _newFulfillerId;
        emit CollectionFulfillerIdUpdated(
            _collectionId,
            oldFufillerId,
            _newFulfillerId,
            msg.sender
        );
    }

    function setCollectionURI(
        string memory _newURI,
        uint256 _collectionId
    ) external onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );
        string memory oldURI = _collections[_collectionId].uri;
        _collections[_collectionId].uri = _newURI;
        emit CollectionURIUpdated(_collectionId, oldURI, _newURI, msg.sender);
    }

    function setCollectionDiscount(
        uint256 _newDiscount,
        uint256 _collectionId
    ) external onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );
        _discount[_collectionId] = _newDiscount;
        emit CollectionDiscountUpdated(_collectionId, _newDiscount, msg.sender);
    }

    function setCollectionPrice(
        uint256 _collectionId,
        uint256[] memory _newPrice
    ) external onlyCreator(_collectionId) {
        require(
            !_collections[_collectionId].isDeleted,
            "ListenerCollection: This collection has been deleted."
        );
        uint256[] memory oldPrice = _collections[_collectionId].price;
        _collections[_collectionId].price = _newPrice;
        emit CollectionPriceUpdated(
            _collectionId,
            oldPrice,
            _newPrice,
            msg.sender
        );
    }

    function getCollectionSupply() public view returns (uint256) {
        return _collectionSupply;
    }

    function getAccessControlContract() public view returns (address) {
        return address(_accessControl);
    }

    function getListenerPaymentContract() public view returns (address) {
        return address(_listenerPayment);
    }

    function getListenerNFTContract() public view returns (address) {
        return address(_listenerNFT);
    }

    function getListenerMarketContract() public view returns (address) {
        return address(_listenerMarket);
    }

    function getListenerFulfillmentContract() public view returns (address) {
        return address(_listenerFulfillment);
    }
}
