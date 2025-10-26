// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AllowlistPolicy {
    address public owner;
    mapping(address=>bool) public approved;
    event Approved(address indexed user, bool status);
    constructor(){ owner=msg.sender; }
    modifier onlyOwner(){ require(msg.sender==owner, "OWNER"); _; }
    function setOwner(address o) external onlyOwner { owner=o; }
    function setApproved(address user, bool status) external onlyOwner { approved[user]=status; emit Approved(user,status); }
    function canBorrow(address user, uint256) external view returns(bool){ return approved[user]; }
}
