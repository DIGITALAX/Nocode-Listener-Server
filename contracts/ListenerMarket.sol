// SPDX-License-Identifier: UNLICENSE

import "./ListenerAccessControl.sol";
import "./ListenerCollection.sol";
import "./ListenerFulfillment.sol";
import "./ListenerNFT.sol";
import "./ListenerPayment.sol";
import "./ListenerOracle.sol";

pragma solidity ^0.8.9;

library MarketParamsLibrary {
    struct MarketParams {
        uint256[] listenerIds;
        uint256[] listenerAmounts;
        uint256[] indexes;
        string fulfillmentDetails;
        address chosenTokenAddress;
    }
}

contract ListenerMarket {
    ListenerCollection private _listenerCollection;
    ListenerNFT private _listenerNFT;
    ListenerOracle private _oracle;
    ListenerPayment private _listenerPayment;
    ListenerAccessControl private _accessControl;
    ListenerFulfillment private _listenerFulfillment;
    uint256 private _orderSupply;
    string public symbol;
    string public name;

    struct Order {
        uint256 orderId;
        uint256 tokenId;
        uint256 timestamp;
        uint256 fulfillerId;
        uint256 price;
        string status;
        string details;
        address buyer;
        address chosenAddress;
        bool isFulfilled;
    }

    mapping(uint256 => uint256) private _listenerTokensSold;
    mapping(uint256 => uint256[]) private _listenerTokenIdsSold;
    mapping(uint256 => Order) private _orders;

    modifier onlyAdmin() {
        require(
            _accessControl.isAdmin(msg.sender),
            "ListenerAccessControl: Only admin can perform this action"
        );
        _;
    }

    modifier onlyFulfiller(uint256 _fulfillerId) {
        require(
            _listenerFulfillment.getFulfillerAddress(_fulfillerId) ==
                msg.sender,
            "ListenerMarket: Only the fulfiller can update this status."
        );
        _;
    }

    event AccessControlUpdated(
        address indexed oldAccessControl,
        address indexed newAccessControl,
        address updater
    );
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle,
        address updater
    );
    event ListenerCollectionUpdated(
        address indexed oldListenerCollection,
        address indexed newListenerCollection,
        address updater
    );
    event ListenerNFTUpdated(
        address indexed oldListenerNFT,
        address indexed newListenerNFT,
        address updater
    );
    event CompositeNFTUpdated(
        address indexed oldCompositeNFT,
        address indexed newCompositeNFT,
        address updater
    );
    event ListenerPaymentUpdated(
        address indexed oldListenerPayment,
        address indexed newListenerPayment,
        address updater
    );
    event ChildFGOUpdated(
        address indexed oldChildFGO,
        address indexed newChildFGO,
        address updater
    );
    event ParentFGOUpdated(
        address indexed oldParentFGO,
        address indexed newParentFGO,
        address updater
    );
    event ListenerFulfillmentUpdated(
        address indexed oldListenerFulfillment,
        address indexed newListenerFulfillment,
        address updater
    );
    event TokensBought(
        uint256[] listenerIds,
        uint256[] listenerAmounts,
        address chosenTokenAddress,
        uint256[] prices,
        address buyer
    );

    event OrderIsFulfilled(uint256 indexed _orderId, address _fulfillerAddress);

    event OrderCreated(
        uint256 indexed orderId,
        uint256 totalPrice,
        address buyer,
        string fulfillmentInformation,
        uint256 fulfillerId
    );
    event UpdateOrderDetails(
        uint256 indexed _orderId,
        string newOrderDetails,
        address buyer
    );
    event UpdateOrderStatus(
        uint256 indexed _orderId,
        string newOrderStatus,
        address buyer
    );

    constructor(
        address _collectionContract,
        address _accessControlContract,
        address _fulfillmentContract,
        address _listenerPaymentContract,
        address _listenerNFTContract,
        address _oracleAddress,
        string memory _symbol,
        string memory _name
    ) {
        _listenerCollection = ListenerCollection(_collectionContract);
        _accessControl = ListenerAccessControl(_accessControlContract);
        _listenerPayment = ListenerPayment(_listenerPaymentContract);
        _oracle = ListenerOracle(_oracleAddress);
        _listenerFulfillment = ListenerFulfillment(_fulfillmentContract);
        _listenerNFT = ListenerNFT(_listenerNFTContract);
        symbol = _symbol;
        name = _name;
        _orderSupply = 0;
    }

    function buyTokens(
        MarketParamsLibrary.MarketParams memory params
    ) external {
        require(
            _listenerPayment.checkIfAddressVerified(params.chosenTokenAddress),
            "ListenerPayment: Not a valid chosen payment address."
        );
        require(
            params.listenerIds.length == params.listenerAmounts.length,
            "ListenerMarket: Each token must have an amount."
        );

        uint256[] memory _prices = new uint256[](params.listenerIds.length);
        uint256 exchangeRate = _oracle.getRateByAddress(
            params.chosenTokenAddress
        );

        for (uint256 i = 0; i < params.listenerIds.length; i++) {
            (uint256 price, uint256 fulfillerId) = _listenerCollectionMint(
                params.listenerIds[i],
                exchangeRate,
                params.listenerAmounts[i],
                params.indexes[i],
                params.chosenTokenAddress
            );
            _canPurchase(
                params.chosenTokenAddress,
                price * params.listenerAmounts[i]
            );
            address creator = _listenerCollection.getCollectionCreator(
                params.listenerIds[i]
            );
            _transferTokens(
                params.chosenTokenAddress,
                creator,
                msg.sender,
                price * params.listenerAmounts[i],
                fulfillerId
            );
            _prices[i] = price * params.listenerAmounts[i];
            _listenerCollection.purchaseAndMintToken(
                params.listenerIds[i],
                params.listenerAmounts[i],
                params.indexes[i],
                msg.sender,
                params.chosenTokenAddress
            );

            uint256[] memory _tokenIds = _listenerCollection
                .getCollectionTokenIds(params.listenerIds[i]);

            _listenerTokensSold[params.listenerIds[i]] += params
                .listenerAmounts[i];

            _listenerTokenIdsSold[params.listenerIds[i]] = _tokenIds;

            _createOrder(
                params.chosenTokenAddress,
                msg.sender,
                price * params.listenerAmounts[i],
                fulfillerId,
                _tokenIds[_tokenIds.length - 1],
                params.fulfillmentDetails
            );
        }

        emit TokensBought(
            params.listenerIds,
            params.listenerAmounts,
            params.chosenTokenAddress,
            _prices,
            msg.sender
        );
    }

    function _createOrder(
        address _chosenAddress,
        address _buyer,
        uint256 _price,
        uint256 _fulfillerId,
        uint256 _tokenId,
        string memory _fulfillmentDetails
    ) internal {
        _orderSupply++;

        Order memory newOrder = Order({
            orderId: _orderSupply,
            tokenId: _tokenId,
            details: _fulfillmentDetails,
            buyer: _buyer,
            chosenAddress: _chosenAddress,
            price: _price,
            timestamp: block.timestamp,
            status: "ordered",
            isFulfilled: false,
            fulfillerId: _fulfillerId
        });

        _orders[_orderSupply] = newOrder;

        emit OrderCreated(
            _orderSupply,
            _price,
            _buyer,
            _fulfillmentDetails,
            _fulfillerId
        );
    }

    function _transferTokens(
        address _chosenAddress,
        address _creator,
        address _buyer,
        uint256 _price,
        uint256 _fulfillerId
    ) internal {
        IERC20(_chosenAddress).transferFrom(
            _buyer,
            _creator,
            _price -
                ((_price *
                    (_listenerFulfillment.getFulfillerPercent(_fulfillerId))) /
                    100)
        );
        IERC20(_chosenAddress).transferFrom(
            _buyer,
            _listenerFulfillment.getFulfillerAddress(_fulfillerId),
            ((_price *
                (_listenerFulfillment.getFulfillerPercent(_fulfillerId))) / 100)
        );
    }

    function _listenerCollectionMint(
        uint256 _collectionId,
        uint256 _exchangeRate,
        uint256 _amount,
        uint256 _chosenIndex,
        address _chosenTokenAddress
    ) internal view returns (uint256, uint256) {
        require(
            _listenerCollection.getCollectionTokensMinted(_collectionId) +
                _amount <
                _listenerCollection.getCollectionAmount(_collectionId),
            "ListenerMarket: No more tokens can be bought from this collection."
        );

        uint256 collectionIndex = _listenerCollection.getCollectionIndex(
            _collectionId
        );

        uint256 basePrice = _listenerCollection.getCollectionPrice(
            _collectionId
        )[_chosenIndex];

        uint256 listenerPrice = _calculateAmount(
            basePrice,
            _exchangeRate,
            _chosenTokenAddress
        );

        if (_listenerCollection.getCollectionDiscount(_collectionId) != 0) {
            listenerPrice =
                listenerPrice -
                ((listenerPrice *
                    _listenerCollection.getCollectionDiscount(_collectionId)) /
                    100);
        }

        uint256 fulfillerId = _listenerCollection.getCollectionFulfillerId(
            _collectionId
        );

        return (listenerPrice, fulfillerId);
    }

    function _canPurchase(
        address _chosenAddress,
        uint256 _price
    ) internal view {
        uint256 allowance = IERC20(_chosenAddress).allowance(
            msg.sender,
            address(this)
        );

        require(
            allowance >= _price,
            "ListenerMarket: Insufficient Approval Allowance."
        );
    }

    function _calculateAmount(
        uint256 _amountInWei,
        uint256 _exchangeRate,
        address _tokenAddress
    ) internal view returns (uint256) {
        require(
            _amountInWei > 0 && _exchangeRate > 0,
            "ListenerMarket: Invalid calculation amounts."
        );
        uint256 tokenAmount = (_amountInWei * (10 ** 18)) / _exchangeRate;
        if (_tokenAddress == _oracle.getTetherAddress()) {
            tokenAmount = tokenAmount / (10 ** 12);
        }
        return tokenAmount;
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

    function updateListenerCollection(
        address _newListenerCollectionAddress
    ) external onlyAdmin {
        address oldAddress = address(_listenerCollection);
        _listenerCollection = ListenerCollection(_newListenerCollectionAddress);
        emit ListenerCollectionUpdated(
            oldAddress,
            _newListenerCollectionAddress,
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

    function updateListenerFulfillment(
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

    function updateOracle(address _newOracleAddress) external onlyAdmin {
        address oldAddress = address(_oracle);
        _oracle = ListenerOracle(_newOracleAddress);
        emit OracleUpdated(oldAddress, _newOracleAddress, msg.sender);
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

    function getCollectionListenerSoldCount(
        uint256 _collectionId
    ) public view returns (uint256) {
        return _listenerTokensSold[_collectionId];
    }

    function getTokensSoldCollectionListener(
        uint256 _collectionId
    ) public view returns (uint256[] memory) {
        return _listenerTokenIdsSold[_collectionId];
    }

    function getOrderTokenId(uint256 _orderId) public view returns (uint256) {
        return _orders[_orderId].tokenId;
    }

    function getOrderDetails(
        uint256 _orderId
    ) public view returns (string memory) {
        return _orders[_orderId].details;
    }

    function getOrderBuyer(uint256 _orderId) public view returns (address) {
        return _orders[_orderId].buyer;
    }

    function getOrderChosenAddress(
        uint256 _orderId
    ) public view returns (address) {
        return _orders[_orderId].chosenAddress;
    }

    function getOrderTimestamp(uint256 _orderId) public view returns (uint256) {
        return _orders[_orderId].timestamp;
    }

    function getOrderStatus(
        uint256 _orderId
    ) public view returns (string memory) {
        return _orders[_orderId].status;
    }

    function getOrderIsFulfilled(uint256 _orderId) public view returns (bool) {
        return _orders[_orderId].isFulfilled;
    }

    function getOrderFulfillerId(
        uint256 _orderId
    ) public view returns (uint256) {
        return _orders[_orderId].fulfillerId;
    }
    
    function getOrderSupply() public view returns (uint256) {
        return _orderSupply;
    }

    function setOrderisFulfilled(
        uint256 _orderId
    ) external onlyFulfiller(_orders[_orderId].fulfillerId) {
        _orders[_orderId].isFulfilled = true;
        emit OrderIsFulfilled(_orderId, msg.sender);
    }

    function setOrderStatus(
        uint256 _orderId,
        string memory _status
    ) external onlyFulfiller(_orders[_orderId].fulfillerId) {
        _orders[_orderId].status = _status;
        emit UpdateOrderStatus(_orderId, _status, msg.sender);
    }

    function setOrderDetails(
        uint256 _orderId,
        string memory _newDetails
    ) external {
        require(
            _orders[_orderId].buyer == msg.sender,
            "ListenerMarket: Only the buyer can update their order details."
        );
        _orders[_orderId].details = _newDetails;
        emit UpdateOrderDetails(_orderId, _newDetails, msg.sender);
    }

    function getAccessControlContract() public view returns (address) {
        return address(_accessControl);
    }

    function getListenerCollectionContract() public view returns (address) {
        return address(_listenerCollection);
    }

    function getListenerNFTContract() public view returns (address) {
        return address(_listenerNFT);
    }

    function getListenerFulfillmentContract() public view returns (address) {
        return address(_listenerFulfillment);
    }

    function getOracleContract() public view returns (address) {
        return address(_oracle);
    }

    function getListenerPayment() public view returns (address) {
        return address(_listenerPayment);
    }
}
