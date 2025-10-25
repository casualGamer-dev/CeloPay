// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract ProfileRegistry {
    struct Profile { string name; string phone; bool set; }
    mapping(address => Profile) private profiles;
    event ProfileUpdated(address indexed user, string name, string phone);
    function setProfile(string calldata name, string calldata phone) external {
        profiles[msg.sender] = Profile({ name: name, phone: phone, set: true });
        emit ProfileUpdated(msg.sender, name, phone);
    }
    function getProfile(address user) external view returns (string memory, string memory, bool) {
        Profile storage p = profiles[user];
        return (p.name, p.phone, p.set);
    }
}
