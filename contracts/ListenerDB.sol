// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.9;

import "./ListenerAccessControl.sol";

contract ListenerDB {
    string public name;
    string public symbol;
    string private _pkpAssignedPublicKey;
    address private _pkpAssignedAddress;
    uint256 private _pkpAssignedTokenId;
    ListenerAccessControl private _listenerAccessControl;

    struct Circuit {
        string _id;
        string _encryptedInformation;
        address _instantiatorAddress;
    }

    modifier onlyAdmin(address _sender) {
        require(
            _listenerAccessControl.isAdmin(_sender),
            "Only Admin can update the assigned PKP Address."
        );
        _;
    }

    modifier onlyPKP(address _sender) {
        require(
            _sender == _pkpAssignedAddress,
            "Only assigned PKP can perform this function."
        );
        _;
    }

    // address to encrypted Circuit and Log strings
    mapping(address => mapping(string => Circuit[]))
        private _addressIdToCircuit;
    mapping(address => mapping(string => string[])) private _addressIdToLogs;

    event PKPSet(
        address indexed oldPKPAddress,
        address indexed newPKPAddress,
        address updater
    );

    event LogAdded(
        string indexed circuitId,
        string stringifiedEncryptedLog,
        address instantiatorAddress
    );

    event CircuitAdded(
        string indexed circuitId,
        string encryptedCircuitInformation,
        address instantiatorAddress
    );

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _pkpPublicKey,
        address _listenerAccessControlAddress,
        address _pkpAddress,
        uint256 _pkpTokenId
    ) {
        name = _name;
        symbol = _symbol;
        _listenerAccessControl = ListenerAccessControl(
            _listenerAccessControlAddress
        );
        _pkpAssignedAddress = _pkpAddress;
        _pkpAssignedPublicKey = _pkpPublicKey;
        _pkpAssignedTokenId = _pkpTokenId;
    }

    function addCircuitOnChain(
        string memory _encryptedCircuitInformation,
        address _instantiatorAddress,
        string memory _circuitId
    ) external onlyPKP(msg.sender) {
        Circuit memory newCircuit = Circuit({
            _id: _circuitId,
            _encryptedInformation: _encryptedCircuitInformation,
            _instantiatorAddress: _instantiatorAddress
        });

        _addressIdToCircuit[_instantiatorAddress][_circuitId].push(newCircuit);

        emit CircuitAdded(
            _circuitId,
            _encryptedCircuitInformation,
            _instantiatorAddress
        );
    }

    function addLogToCircuit(
        address _instantiatorAddress,
        string memory _circuitId,
        string memory _stringifiedEncryptedLog
    ) external onlyPKP(msg.sender) {
        _addressIdToLogs[_instantiatorAddress][_circuitId].push(
            _stringifiedEncryptedLog
        );

        emit LogAdded(
            _circuitId,
            _stringifiedEncryptedLog,
            _instantiatorAddress
        );
    }

    function getPKPAssignedAddress() public view returns (address) {
        return (_pkpAssignedAddress);
    }

    function getPKPAssignedPublicKey() public view returns (string memory) {
        return (_pkpAssignedPublicKey);
    }

    function getPKPAssignedTokenId() public view returns (uint256) {
        return (_pkpAssignedTokenId);
    }

    function getListenerAccessControl() public view returns (address) {
        return (address(_listenerAccessControl));
    }
}
