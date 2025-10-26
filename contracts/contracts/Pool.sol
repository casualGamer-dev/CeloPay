// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// (same as previous Pool.sol but shortened for brevity in this artifact)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}
contract ReentrancyGuard { uint256 private _u=1; modifier nonReentrant(){require(_u==1);_u=2;_;_u=1;} }
contract ERC20Receipt {
    string public name; string public symbol; uint8 public constant decimals = 18;
    uint256 public totalSupply; mapping(address=>uint256) public balanceOf; mapping(address=>mapping(address=>uint256)) public allowance;
    event Transfer(address indexed from,address indexed to,uint256 value); event Approval(address indexed owner,address indexed spender,uint256 value);
    constructor(string memory n,string memory s){name=n;symbol=s;}
    function _mint(address to,uint256 a) internal { totalSupply+=a; balanceOf[to]+=a; emit Transfer(address(0),to,a); }
    function _burn(address from,uint256 a) internal { balanceOf[from]-=a; totalSupply-=a; emit Transfer(from,address(0),a); }
    function approve(address sp,uint256 a) external returns(bool){ allowance[msg.sender][sp]=a; emit Approval(msg.sender,sp,a); return true; }
    function transfer(address to,uint256 a) external returns(bool){ balanceOf[msg.sender]-=a; balanceOf[to]+=a; emit Transfer(msg.sender,to,a); return true; }
    function transferFrom(address f,address t,uint256 a) external returns(bool){ uint256 al=allowance[f][msg.sender]; if(al!=type(uint256).max){ allowance[f][msg.sender]=al-a;} balanceOf[f]-=a; balanceOf[t]+=a; emit Transfer(f,t,a); return true; }
}
interface IPolicy { function canBorrow(address borrower, uint256 amount) external view returns (bool); }
contract CeloPayPool is ERC20Receipt, ReentrancyGuard {
    IERC20 public immutable asset; IPolicy public policy; address public admin;
    uint256 public totalCash; uint256 public totalBorrows; uint256 public totalReserves; uint256 public borrowIndex=1e18; uint256 public accrualTimestamp;
    uint256 public reserveFactor=1e17; uint256 public baseRate=0; uint256 public slope1=5e15; uint256 public slope2=2e16; uint256 public kink=8e17;
    mapping(address=>uint256) public principal; mapping(address=>uint256) public borrowerIndex;
    event Deposit(address indexed user,uint256 amount,uint256 shares); event Withdraw(address indexed user,uint256 shares,uint256 amount);
    event Borrow(address indexed user,uint256 amount,uint256 fee); event Repay(address indexed user,uint256 amount);
    constructor(address _asset) ERC20Receipt("CeloPay Pool LP","CP-LP"){ asset=IERC20(_asset); admin=msg.sender; accrualTimestamp=block.timestamp; }
    modifier onlyAdmin(){ require(msg.sender==admin,"ADMIN"); _; }
    function setPolicy(address p) external onlyAdmin { policy=IPolicy(p); }
    function utilization() public view returns(uint256){ uint256 s=totalCash+totalBorrows; return s==0?0:(totalBorrows*1e18)/s; }
    function borrowRatePerSec() public view returns(uint256){ uint256 u=utilization(); if(u<=kink){ return baseRate+(slope1*u/1e18);} uint256 left=baseRate+(slope1*kink/1e18); return left+(slope2*(u-kink)/1e18); }
    function supplyRatePerSec() public view returns(uint256){ uint256 br=borrowRatePerSec(); uint256 u=utilization(); return br*u/1e18*(1e18-reserveFactor)/1e18; }
    function exchangeRate() public view returns(uint256){ uint256 s=totalSupply; uint256 a=totalCash+totalBorrows-totalReserves; return s==0?1e18:(a*1e18)/s; }
    function borrowBalanceCurrent(address b) public view returns(uint256){ if(principal[b]==0) return 0; uint256 idx=borrowerIndex[b]; return (principal[b]*borrowIndex)/(idx==0?1e18:idx); }
    function accrueInterest() public { uint256 dt=block.timestamp-accrualTimestamp; if(dt==0) return; uint256 br=borrowRatePerSec(); uint256 interest=(totalBorrows*br*dt)/1e18; totalBorrows+=interest; uint256 r=(interest*reserveFactor)/1e18; totalReserves+=r; borrowIndex=borrowIndex+(borrowIndex*br*dt)/1e18; accrualTimestamp=block.timestamp; }
    function deposit(uint256 amount) external nonReentrant { accrueInterest(); require(amount>0,"amount=0"); uint256 ex=exchangeRate(); uint256 shares= totalSupply==0?amount:(amount*1e18)/ex; require(asset.transferFrom(msg.sender,address(this),amount),"xfer"); totalCash+=amount; _mint(msg.sender,shares); emit Deposit(msg.sender,amount,shares); }
    function withdraw(uint256 shares) external nonReentrant { accrueInterest(); require(shares>0,"shares=0"); uint256 amount=(shares*exchangeRate())/1e18; require(amount<=totalCash,"illiquid"); _burn(msg.sender,shares); totalCash-=amount; require(asset.transfer(msg.sender,amount),"xfer"); emit Withdraw(msg.sender,shares,amount); }
    function borrow(uint256 amount) external nonReentrant { accrueInterest(); require(address(policy)!=address(0),"policy"); require(policy.canBorrow(msg.sender,amount),"reject"); require(amount>0 && amount<=totalCash,"amt"); totalCash-=amount; totalBorrows+=amount; if(borrowerIndex[msg.sender]==0) borrowerIndex[msg.sender]=borrowIndex; principal[msg.sender]+=amount; require(asset.transfer(msg.sender,amount),"xfer"); emit Borrow(msg.sender,amount,0); }
    function repay(uint256 amount) external nonReentrant { accrueInterest(); require(principal[msg.sender]>0,"no debt"); uint256 owed=borrowBalanceCurrent(msg.sender); uint256 pay= amount>owed?owed:amount; require(asset.transferFrom(msg.sender,address(this),pay),"xfer"); totalCash+=pay; if(pay>=principal[msg.sender]){ totalBorrows-=principal[msg.sender]; principal[msg.sender]=0; borrowerIndex[msg.sender]=borrowIndex; } else { principal[msg.sender]-=pay; totalBorrows-=pay; } emit Repay(msg.sender,pay); }
    function markDefault(address borrower) external onlyAdmin { accrueInterest(); uint256 owed=borrowBalanceCurrent(borrower); if(owed==0) return; uint256 r=totalReserves; if(r>=owed){ totalReserves=r-owed; } else { uint256 rem=owed-r; totalReserves=0; if(rem>totalBorrows) totalBorrows=0; else totalBorrows-=rem; } principal[borrower]=0; borrowerIndex[borrower]=borrowIndex; }
}
