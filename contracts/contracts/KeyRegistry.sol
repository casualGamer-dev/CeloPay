// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract KeyRegistry {
    struct Keys { string kyber; string dilithium; bool set; }
    mapping(address => Keys) private keysByUser;
    event KeysUpdated(address indexed user, string kyber, string dilithium);
    function setKeys(string calldata kyber, string calldata dilithium) external {
        keysByUser[msg.sender] = Keys({ kyber: kyber, dilithium: dilithium, set: true });
        emit KeysUpdated(msg.sender, kyber, dilithium);
    }
    function getKeys(address user) external view returns (string memory, string memory, bool) {
        Keys storage k = keysByUser[user];
        return (k.kyber, k.dilithium, k.set);
    }
}
