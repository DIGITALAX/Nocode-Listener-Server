// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.9;

import "./ListenerAccessControl.sol";

contract LitActionDB {
    string public name;
    string public symbol;
    ListenerAccessControl private _listenerAccessControl;

    modifier onlyAdmin() {
        require(
            _listenerAccessControl.isAdmin(msg.sender),
            "Only Admin can remove an item from the DB."
        );
        _;
    }

    mapping(string => string) private _idToIPFS;

    event DBEntryAdded(string indexed circuitId, string ipfsHash);

    event DBEntryRemoved(string indexed circuitId, string circuitInformation);

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

    function addEntryToDB(
        string memory _circuitId,
        string memory _ipfsHash
    ) external {
        _idToIPFS[_circuitId] = _ipfsHash;

        emit DBEntryAdded(_circuitId, _ipfsHash);
    }

    function removeEntryFromDB(
        string memory _circuitId,
        string memory _ipfsHash
    ) external onlyAdmin {
        delete _idToIPFS[_circuitId];

        emit DBEntryRemoved(_circuitId, _ipfsHash);
    }

    function getDatabaseEntry(
        string memory _circuitId
    ) public view returns (string memory) {
        return _idToIPFS[_circuitId];
    }
}
