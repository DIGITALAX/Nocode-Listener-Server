// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.9;

import "./ListenerAccessControl.sol";
import "./ListenerDB.sol";

contract ListenerFactory {
    string public name;
    string public symbol;

    event AccessControlSet(
        address indexed oldAccessControl,
        address indexed newAccessControl,
        address updater
    );

    event ListenerFactoryDeployed(
        address pkpAddress,
        address listenerAccessControlAddress,
        address listenerDBAddress,
        address indexed deployer,
        uint256 timestamp
    );

    mapping(address => address[]) private _deployedListenerAccessControl;
    mapping(address => address[]) private _mintedPKPs;
    mapping(address => address[]) private _deployedListenerDB;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function deployFromFactory(
        address _mintedPKPAddress,
        string memory _mintedPKPPublicKey,
        uint256 _mintedPKPTokenId
    ) public {
        address _instantiatorAddress = msg.sender;

        // Deploy ListenerAccessControl
        ListenerAccessControl newListenerAccessControl = new ListenerAccessControl(
                "ListenerAccessControl",
                "LAC",
                _instantiatorAddress
            );

        // Deploy ListenerDB
        ListenerDB newListenerDB = new ListenerDB(
            "ListenerDB",
            "LDB",
            _mintedPKPPublicKey,
            address(newListenerAccessControl),
            _mintedPKPAddress,
            _mintedPKPTokenId
        );

        _mintedPKPs[_instantiatorAddress].push(_mintedPKPAddress);
        _deployedListenerDB[_instantiatorAddress].push(address(newListenerDB));
        _deployedListenerAccessControl[_instantiatorAddress].push(
            address(newListenerAccessControl)
        );

        emit ListenerFactoryDeployed(
            _mintedPKPAddress,
            address(newListenerAccessControl),
            address(newListenerDB),
            msg.sender,
            block.timestamp
        );
    }

    function getMintedPKPs(
        address _deployerAddress
    ) public view returns (address[] memory) {
        return _mintedPKPs[_deployerAddress];
    }

    function getDeployedListenerAccessControl(
        address _deployerAddress
    ) public view returns (address[] memory) {
        return _deployedListenerAccessControl[_deployerAddress];
    }

    function getDeployedListenerDB(
        address _deployerAddress
    ) public view returns (address[] memory) {
        return _deployedListenerDB[_deployerAddress];
    }
}
