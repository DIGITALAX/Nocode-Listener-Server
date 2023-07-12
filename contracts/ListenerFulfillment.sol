// SPDX-License-Identifier: UNLICENSE

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ListenerAccessControl.sol";

contract ListenerFulfillment {
    ListenerAccessControl private _accessControl;
    uint256 private _fullfillerCount;
    uint256 private _activeFulfillers;
    string public symbol;
    string public name;

    struct Fulfiller {
        uint256 fulfillerId;
        uint256 fulfillerPercent;
        address fulfillerAddress;
    }

    mapping(uint256 => Fulfiller) private _fulfillers;

    event AccessControlUpdated(
        address indexed oldAccessControl,
        address indexed newAccessControl,
        address updater
    );

    event FulfillerAddressUpdated(
        uint256 indexed fulfillerId,
        address newFulfillerAddress
    );

    event FulfillerCreated(
        uint256 indexed fulfillerId,
        uint256 fulfillerPercent,
        address fulfillerAddress
    );

    event FulfillerPercentUpdated(
        uint256 indexed fulfillerId,
        uint256 newFulfillerPercent
    );

    modifier onlyAdmin() {
        require(
            _accessControl.isAdmin(msg.sender),
            "ListenerAccessControl: Only admin can perform this action"
        );
        _;
    }

    modifier onlyFulfiller(uint256 _fulfillerId) {
        require(
            msg.sender == _fulfillers[_fulfillerId].fulfillerAddress,
            "ListenerFulfillment: Only the fulfiller can update."
        );
        _;
    }

    constructor(
        address _accessControlContract,
        string memory _symbol,
        string memory _name
    ) {
        _accessControl = ListenerAccessControl(_accessControlContract);
        symbol = _symbol;
        name = _name;
        _fullfillerCount = 0;
    }

    function createFulfiller(
        uint256 _fulfillerPercent,
        address _fulfillerAddress
    ) external onlyAdmin {
        require(
            _fulfillerPercent < 100,
            "ListenerFulfillment: Percent can not be greater than 100."
        );
        _fullfillerCount++;
        _activeFulfillers++;

        Fulfiller memory newFulfiller = Fulfiller({
            fulfillerId: _fullfillerCount,
            fulfillerPercent: _fulfillerPercent,
            fulfillerAddress: _fulfillerAddress
        });

        _fulfillers[_fullfillerCount] = newFulfiller;

        emit FulfillerCreated(
            _fullfillerCount,
            _fulfillerPercent,
            _fulfillerAddress
        );
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

    function updateFulfillerPercent(
        uint256 _fulfillerId,
        uint256 _fulfillerPercent
    ) public onlyFulfiller(_fulfillerId) {
        require(
            _fulfillerId <= _fullfillerCount,
            "ListenerFulfillment: Fulfiller does not exist."
        );
        _fulfillers[_fulfillerId].fulfillerPercent = _fulfillerPercent;
        emit FulfillerPercentUpdated(_fulfillerId, _fulfillerPercent);
    }

    function updateFulfillerAddress(
        uint256 _fulfillerId,
        address _newFulfillerAddress
    ) public onlyFulfiller(_fulfillerId) {
        require(
            _fulfillers[_fulfillerId].fulfillerId != 0,
            "ListenerFulfillment: Fulfiller does not exist."
        );
        _fulfillers[_fulfillerId].fulfillerAddress = _newFulfillerAddress;
        emit FulfillerAddressUpdated(_fulfillerId, _newFulfillerAddress);
    }

    function removeFulfiller(uint256 _fulfillerId) public onlyAdmin {
        delete _fulfillers[_fulfillerId];
        _activeFulfillers -= 1;
    }

    function getFulfillerAddress(
        uint256 _fulfillerId
    ) public view returns (address) {
        return _fulfillers[_fulfillerId].fulfillerAddress;
    }

    function getFulfillerCount() public view returns (uint256) {
        return _activeFulfillers;
    }

    function getFulfillerPercent(
        uint256 _fulfillerId
    ) public view returns (uint256) {
        return _fulfillers[_fulfillerId].fulfillerPercent;
    }

    function getAccessControlContract() public view returns (address) {
        return address(_accessControl);
    }
}
