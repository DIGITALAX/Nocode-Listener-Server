// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.9;

import "./ListenerAccessControl.sol";

contract ListenerDB {
    string public name;
    string public symbol;
    address private _pkpAssigned;
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
            _sender == _pkpAssigned,
            "Only assigned PKP can perform this function."
        );
        _;
    }

    // address to encrypted Circuit and Log strings
    mapping(address => mapping(string => Circuit[]))
        private _addressIdToCircuit;
    mapping(address => mapping(string => string[])) private _addressIdToLogs;

    constructor(
        string memory _name,
        string memory _symbol,
        address _listenerAccessControlAddress
    ) {
        name = _name;
        symbol = _symbol;
        _listenerAccessControl = ListenerAccessControl(
            _listenerAccessControlAddress
        );
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
    }

    function addLogToCircuit(
        address _instantiatorAddress,
        string memory _circuitId,
        string memory _stringifiedLog
    ) external onlyPKP(msg.sender) {
        _addressIdToLogs[_instantiatorAddress][_circuitId].push(
            _stringifiedLog
        );
    }

    function getPKPAssigned() public view returns (address) {
        return (_pkpAssigned);
    }

    function setPKPAssigned(
        address _newPKPAddress
    ) public onlyAdmin(msg.sender) {
        _pkpAssigned = _newPKPAddress;
    }

    function getListenerAccessControl() public view returns (address) {
        return (address(_listenerAccessControl));
    }

    function setListenerAccessControl(
        address _newListenerAccessControl
    ) public onlyAdmin(msg.sender) {
        _listenerAccessControl = ListenerAccessControl(
            _newListenerAccessControl
        );
    }
}
