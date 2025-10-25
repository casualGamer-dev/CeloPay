
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

contract NyaayaPay {
    struct Circle { string name; string description; address createdBy; uint256 createdAt; bool exists; }
    struct LoanRequest {
        address borrower; bytes32 circleId; uint256 amount; uint8 installments; address[] approvals;
        bool approved; bool repaid; uint256 createdAt;
    }

    IERC20 public token;
    mapping(bytes32 => Circle) public circles;
    mapping(bytes32 => address[]) public circleMembers;
    mapping(bytes32 => LoanRequest) public loanRequests;

    event CircleCreated(bytes32 indexed circleId, string name, address indexed createdBy);
    event MemberJoined(bytes32 indexed circleId, address indexed member);
    event LoanRequested(bytes32 indexed requestId, bytes32 indexed circleId, address indexed borrower, uint256 amount);
    event LoanApproved(bytes32 indexed requestId, address indexed approver);
    event LoanFinalized(bytes32 indexed requestId);
    event LoanRepaid(bytes32 indexed requestId, address indexed payer);

    constructor(address tokenAddress) { token = IERC20(tokenAddress); }

    function _circleId(address creator, string memory name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(creator, name));
    }

    function createCircle(string calldata name, string calldata description) external returns (bytes32) {
        bytes32 id = _circleId(msg.sender, name);
        require(!circles[id].exists, "Circle exists");
        circles[id] = Circle({name: name, description: description, createdBy: msg.sender, createdAt: block.timestamp, exists: true});
        circleMembers[id].push(msg.sender);
        emit CircleCreated(id, name, msg.sender);
        emit MemberJoined(id, msg.sender);
        return id;
    }

    function joinCircle(bytes32 circleId) external {
        require(circles[circleId].exists, "No circle");
        address[] storage members = circleMembers[circleId];
        for (uint i=0;i<members.length;i++) require(members[i] != msg.sender, "Already member");
        members.push(msg.sender);
        emit MemberJoined(circleId, msg.sender);
    }

    function isMember(bytes32 circleId, address user) public view returns (bool) {
        address[] storage members = circleMembers[circleId];
        for (uint i=0;i<members.length;i++) if (members[i] == user) return true;
        return false;
    }

    function requestLoan(bytes32 circleId, uint256 amount, uint8 installments) external returns (bytes32) {
        require(circles[circleId].exists, "No circle");
        require(isMember(circleId, msg.sender), "Join first");
        require(amount > 0, "Invalid amount");
        require(installments > 0 && installments <= 12, "1-12 installments");

        bytes32 rid = keccak256(abi.encodePacked(msg.sender, circleId, amount, block.timestamp));
        address[] memory approvals;
        loanRequests[rid] = LoanRequest({
            borrower: msg.sender, circleId: circleId, amount: amount, installments: installments,
            approvals: approvals, approved: false, repaid: false, createdAt: block.timestamp
        });
        emit LoanRequested(rid, circleId, msg.sender, amount);
        return rid;
    }

    function approveLoan(bytes32 requestId) external {
        LoanRequest storage lr = loanRequests[requestId];
        require(lr.borrower != address(0), "No request");
        require(isMember(lr.circleId, msg.sender), "Not in circle");
        require(!lr.approved, "Already approved");
        for (uint i=0;i<lr.approvals.length;i++) require(lr.approvals[i] != msg.sender, "Already approved");
        lr.approvals.push(msg.sender);
        emit LoanApproved(requestId, msg.sender);

        uint256 membersCount = circleMembers[lr.circleId].length;
        if (lr.approvals.length >= 2 || lr.approvals.length * 100 / membersCount > 30) {
            lr.approved = true;
            emit LoanFinalized(requestId);
        }
    }

    function disburse(bytes32 requestId) external {
        LoanRequest storage lr = loanRequests[requestId];
        require(lr.borrower != address(0), "No request");
        require(lr.approved, "Not approved");
        require(!lr.repaid, "Already repaid");
        require(token.transferFrom(msg.sender, lr.borrower, lr.amount), "transferFrom failed");
    }

    function repay(bytes32 requestId, uint256 amount) external {
        LoanRequest storage lr = loanRequests[requestId];
        require(lr.borrower != address(0), "No request");
        require(msg.sender == lr.borrower, "Only borrower");
        require(!lr.repaid, "Already repaid");
        require(amount >= lr.amount, "Repay full (demo)");
        require(token.transferFrom(msg.sender, address(this), amount), "repay transferFrom failed");
        lr.repaid = true;
        emit LoanRepaid(requestId, msg.sender);
    }
}
