// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract NonFungibleToken is ERC721, Ownable {
    constructor() ERC721("NonFungibleToken", "NFT") {}

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}

contract SUcoin is ERC20{
    constructor() ERC20("suCoin", "SU") {
        _mint(msg.sender, 100000);
    }
}

contract Market{

    struct userData{
        mapping(address=>mapping(uint256=>bool)) own; //NFT balance in market.
        uint256 balance; // balance in SUcoin
        
    }
    struct auctionInfo{
        uint8 auctType; // 0- on market only 1- on auction 2- on regular sale

        uint256 price; // price is set by owner of NFT.

        uint256 timer; // if timer > block.timestamp auction has ended.

        address winner; // winner is set as owner at start. Changes according to auction.

        address oldOwner; // set as old owner.
    }

    address public MarketOwner = address(0xEB63B42b7838550E65dB1c803a427F5383145a55); // DAO address comes here.
    address public suCoinAddress;
    mapping(address => userData) public UserData; // holds users info. (nft's balance etc.)
    mapping(address=> mapping(uint256 => auctionInfo)) public AuctionData; // holds auctions info (which nft is on auction etc.)

    constructor(address SuCoinAddr){
        suCoinAddress = SuCoinAddr;
    }
/**
 * @dev 
 * deposit function for NFT's, 
 * requires the sender to be the owner of the NFT, it also requires
 * the owner to approve the NFT transfer to this contract 
 * beforehand.
 */
    function deposit(address nftAddr, uint256 nftID) public payable{
        NonFungibleToken userToken = NonFungibleToken(nftAddr);
        // requires the owner of the token to be the sender
        require(userToken.ownerOf(nftID) == msg.sender); 
        userToken.transferFrom(msg.sender,address(this),nftID);
        UserData[msg.sender].own[nftAddr][nftID] = true;
    }
/**
 * @dev 
 * withdraw function for NFT's, 
 * requires the sender to be the owner of the NFT ON THE MARKET, 
 */
    function withdraw(address nftAddr, uint256 nftID) public payable{
        require(AuctionData[nftAddr][nftID].auctType == 0 || AuctionData[nftAddr][nftID].auctType == 2);
        NonFungibleToken userToken = NonFungibleToken(nftAddr);
        require(UserData[msg.sender].own[nftAddr][nftID] == true);
        UserData[msg.sender].own[nftAddr][nftID] = false;
        userToken.transferFrom(address(this),msg.sender,nftID);
    }
/**
 * @dev 
 * Deposit function for SuCoin, 
 * requires the sender to send the balance they enter.
 */
    function depositBalance(uint256 amount) public payable{
        SUcoin Sabancicoin = SUcoin(suCoinAddress);
        //require is inside transferfrom.
        Sabancicoin.transferFrom(msg.sender,address(this),amount);
        UserData[msg.sender].balance += amount;
    }
/**
 * @dev 
 * Withdraw function for SuCoin,  
 * requires the sender to have the balance in the market. 
 */
    function withdrawBalance(uint256 amount) public payable{
        SUcoin Sabancicoin = SUcoin(suCoinAddress);
        require(UserData[msg.sender].balance >= amount);
        UserData[msg.sender].balance -= amount;
        Sabancicoin.transfer(msg.sender,amount);
    }

    //AUCTION PART----------------------------
/**
 * @dev 
 * Starts auction for desired NFT, can only be started if the NFT is deposited to the contract.
 * the owner can set a starting price.
 * timer sets the auctions timer, default is 1 minute for testing purposes.
 * ONE BIG ISSUE !!!! can start auction right after the auction has finished, making the last auction useless. and basically making a user lose money. (adding a require statement to fix.)
 * maybe a feature tho ??
 */
    function startAuction(address nftAddr, uint256 nftID,  uint256 startingPrice) public{
        require(AuctionData[nftAddr][nftID].auctType == 0);
        require(UserData[msg.sender].own[nftAddr][nftID] == true, "you dont own this NFT"); // must own nft and put it in the market... (on website maybe make it so it auto transfers and starts)
        require(AuctionData[nftAddr][nftID].timer < block.timestamp, "currently on auction , this message should never be seen !"); // can not be currently on auction. (obselete )
        AuctionData[nftAddr][nftID].oldOwner = msg.sender;
        AuctionData[nftAddr][nftID].timer = block.timestamp + 3600;// unix time.
        AuctionData[nftAddr][nftID].price = startingPrice;
        AuctionData[nftAddr][nftID].winner = msg.sender; // winner is set as owner (default)
        AuctionData[nftAddr][nftID].auctType = 1;
    }
/**
 * @dev 
 * bids on desired NFT,
 * price must increase by 10 SUcoins otherwise it is not valid.
 * owner is allowed to bid on their own NFT.
 */   
    function bid(address nftAddr,uint256 nftID,  uint256 price) public payable{
        require(AuctionData[nftAddr][nftID].auctType == 1);
        require(AuctionData[nftAddr][nftID].timer >= block.timestamp, "this auction ended");// auction is still going on.
        require(msg.sender != AuctionData[nftAddr][nftID].oldOwner, "owner can not bid"); // user can not be NFT's old owner.
        require(UserData[msg.sender].balance >= price, "you dont have enough tokens deposited");// user has to have that many tokens.
        require(price - 10 >= AuctionData[nftAddr][nftID].price , "at least 10 more suCoins than the last bid are needed"); // at least 10 more SUcoin is needed for a proper bid.
        if(UserData[AuctionData[nftAddr][nftID].winner].own[nftAddr][nftID]){// if the winner is owner ( the start of auction )
        //so that no money is sent to the owner at the beginning
            
            UserData[msg.sender].balance -= price; // balance is reducted from the bidder.
            AuctionData[nftAddr][nftID].price = price; // price is set as the new bid.
            AuctionData[nftAddr][nftID].winner = msg.sender; // winner is set as the bidder.
            
        }
        else{
            UserData[msg.sender].balance -= price;// balance is reducted from current bidder.
            UserData[AuctionData[nftAddr][nftID].winner].balance += AuctionData[nftAddr][nftID].price; // balance is returned to old bidder.
            AuctionData[nftAddr][nftID].price = price; // price is set as new price
            AuctionData[nftAddr][nftID].winner = msg.sender; // winner is set as sender.
        }

    }
/**
 * @dev 
 * finishes an auction, can be called by anyone, 
 * winner receives the NFT, old owner receives the current bid.
 */   
    function endAuction(address nftAddr, uint256 nftID)public{
        require(AuctionData[nftAddr][nftID].auctType == 1);
        require(AuctionData[nftAddr][nftID].timer < block.timestamp, "timer has not ran out yet."); //auction has ended. block.timestamp has passed the timer.
        
        if(AuctionData[nftAddr][nftID].oldOwner != AuctionData[nftAddr][nftID].winner)
        { // if auction had no bids, dont do anything.
            UserData[AuctionData[nftAddr][nftID].oldOwner].own[nftAddr][nftID] = false;
            UserData[AuctionData[nftAddr][nftID].oldOwner].balance += AuctionData[nftAddr][nftID].price; // winning bid is given to the NFT's old owner.
            UserData[AuctionData[nftAddr][nftID].winner].own[nftAddr][nftID] = true;
            AuctionData[nftAddr][nftID].auctType = 0;
        }
        
    }
    /** 
     * @dev
     * regular sale part
    */

    function sellRegular(address nftAddr, uint256 nftID, uint256 amount)public{
        require(AuctionData[nftAddr][nftID].auctType == 0);
        require(UserData[msg.sender].own[nftAddr][nftID] == true, "you dont own this NFT"); //must be owner
        AuctionData[nftAddr][nftID].oldOwner = msg.sender;
        AuctionData[nftAddr][nftID].price = amount;
        AuctionData[nftAddr][nftID].auctType = 2;

    }

    function buyRegular(address nftAddr, uint256 nftID)public{
        require(AuctionData[nftAddr][nftID].auctType == 2);
        require(UserData[msg.sender].own[nftAddr][nftID] != true, "you already own this NFT"); //must not be owner
        require(AuctionData[nftAddr][nftID].price <= UserData[msg.sender].balance);
        UserData[msg.sender].balance -= AuctionData[nftAddr][nftID].price;
        UserData[AuctionData[nftAddr][nftID].oldOwner].balance += AuctionData[nftAddr][nftID].price;
        UserData[AuctionData[nftAddr][nftID].oldOwner].own[nftAddr][nftID] = false;
        UserData[msg.sender].own[nftAddr][nftID] = true;
        AuctionData[nftAddr][nftID].auctType = 0;

    }
/**
* @dev
* getter functions for testing.
 */    
    function getMarketBalance() public view returns(uint256){
        return UserData[msg.sender].balance;
    }
    function getUserNftBalance(address tokenAddr, uint256 tokenId) public view returns(bool){
        return UserData[msg.sender].own[tokenAddr][tokenId];
    }
    function getAuctionInfoPrice(address tokenAddr,uint256 tokenId)public view returns(uint256){
        return(AuctionData[tokenAddr][tokenId].price);
    }
    function getAuctionInfoTimer(address tokenAddr,uint256 tokenId)public view returns(uint256){
        return(AuctionData[tokenAddr][tokenId].timer);
    }
    function getAuctionInfoWinner(address tokenAddr,uint256 tokenId)public view returns(address){
        return(AuctionData[tokenAddr][tokenId].winner);
    }
    function getAuctionInfoOldOwner(address tokenAddr,uint256 tokenId)public view returns(address){
        return(AuctionData[tokenAddr][tokenId].oldOwner);
    }
    
    
}