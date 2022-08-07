
const token = artifacts.require("SUcoin");
const NFT = artifacts.require("NonFungibleToken");
const market = artifacts.require("Market");
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const truffleAssert = require('truffle-assertions');
//Sucoin Test, its simple erc20 so not much of a test needed, just here to give some coins to other users.
contract("token", accounts=> {

    it("SUcoin owner sent some coins to other users around", async ()=>
    {
        let instance = await token.deployed();
        let balance = (await instance.balanceOf(accounts[3]));
        
        assert.equal(balance.words[0],"10000");
    });
    
});

//MARKET IMPLEMENTATION TESTS-------
contract("market", accounts =>{

    it("account 0 deposits 1000 tokens to market",async() =>{
        let amount = 1000;
        let tokenInstance = await token.deployed();
        let marketInstance = await market.deployed();
        //approve transfer first.
        await tokenInstance.approve(marketInstance.address,amount,{from:accounts[0]});
        await marketInstance.depositBalance(amount,{from:accounts[0]});
        let bal =await marketInstance.getMarketBalance({from:accounts[0]});
        assert.equal(bal.words[0],amount);
    });
    it("account 1 deposits 1100 tokens to market",async() =>{
        let amount = 1100;
        let tokenInstance = await token.deployed();
        let marketInstance = await market.deployed();
        //approve transfer first.
        await tokenInstance.approve(marketInstance.address,amount,{from:accounts[1]});
        await marketInstance.depositBalance(amount,{from:accounts[1]});
        let bal =await marketInstance.getMarketBalance({from:accounts[1]});
        assert.equal(bal.words[0],amount);
    });
    it("account 2 deposits 1200 tokens to market",async() =>{
        let amount = 1200;
        let tokenInstance = await token.deployed();
        let marketInstance = await market.deployed();
        //approve transfer first.
        await tokenInstance.approve(marketInstance.address,amount,{from:accounts[2]});
        await marketInstance.depositBalance(amount,{from:accounts[2]});
        let bal =await marketInstance.getMarketBalance({from:accounts[2]});
        assert.equal(bal.words[0],amount);
    });
    it("account 5 tries to deposit 100 but fails since they dont have enough money", async() =>{
        let amount = 100;
        let acc = accounts[5];
        let tokenInstance = await token.deployed();
        let marketInstance = await market.deployed();
        //approve transfer first.
        await tokenInstance.approve(marketInstance.address,amount,{from:acc});
        await truffleAssert.reverts(marketInstance.depositBalance(amount,{from:acc}));
    });
    it("account 5 tries to withdraw 100 but fails since they dont have enough money", async() =>{
        let amount = 100;
        let acc = accounts[5];
        let marketInstance = await market.deployed();
        await truffleAssert.reverts(marketInstance.withdrawBalance(amount,{from:acc}));
    });
    it("account 1 withdraws 100 tokens from the market", async()=>{
        let amount = 100;
        let marketInstance = await market.deployed();
        await marketInstance.withdrawBalance(amount,{from:accounts[1]});
        let bal = await marketInstance.getMarketBalance({from:accounts[1]});
        assert.equal(bal.words[0], "1000");

    });
    it("account 2 withdraws 200 tokens from the market", async()=>{
        let amount = 200;
        let marketInstance = await market.deployed();
        await marketInstance.withdrawBalance(amount,{from:accounts[2]});
        let bal = await marketInstance.getMarketBalance({from:accounts[2]});
        assert.equal(bal.words[0], "1000");
    });
    it("account 0 deposits NFT with ID 1 to the market", async() =>{
        let id = 1;
        let acc = accounts[0];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        //give allowance first.
        await NFTinstance.approve(marketInstance.address,id,{from:acc});
        await marketInstance.deposit(nftAddress,id,{from:acc});
        assert.equal(await marketInstance.getUserNftBalance(nftAddress,id,{from:acc}),true)
    });
    it("account 0 deposits NFT with ID 4 to the market", async() =>{
        let id = 4;
        let acc = accounts[0];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        //give allowance first.
        await NFTinstance.approve(marketInstance.address,id,{from:acc});
        await marketInstance.deposit(nftAddress,id,{from:acc});
        assert.equal(await marketInstance.getUserNftBalance(nftAddress,id,{from:acc}),true)
    });
    it("account 5 tries to deposit nft with id 5 but fails since they dont own it", async() =>{
        let id = 2;
        let acc = accounts[5];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        //approve transfer first.
        await truffleAssert.reverts(NFTinstance.approve(marketInstance.address,id,{from:acc}));
        await truffleAssert.reverts(marketInstance.deposit(nftAddress,id,{from:acc}));
    });
    it("account 1 deposits NFT with ID 2 to the market", async() =>{
        let id = 2;
        let acc = accounts[1];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        //give allowance first.
        await NFTinstance.approve(marketInstance.address,id,{from:acc});
        await marketInstance.deposit(nftAddress,id,{from:acc});
        assert.equal(await marketInstance.getUserNftBalance(nftAddress,id,{from:acc}),true)
    });
    it("account 0 starts an auction with their deposited NFT with starting price of 123", async() =>{
        let id = 1;
        let acc = accounts[0];
        let startPrice = 123;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.startAuction(nftAddress,id,startPrice,{from:acc});
        assert.equal(await marketInstance.getAuctionInfoPrice(nftAddress,id,{from:acc}),startPrice);
    });
    it("account 1 bids on the auctioned NFT with the price of 400", async() =>{
        let id = 1;
        let acc = accounts[1];
        let price = 400;
        let remainder = 1000 - price;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.bid(nftAddress,id,price,{from:acc});
        assert.equal(await marketInstance.getAuctionInfoPrice(nftAddress,id,{from:acc}),price);
        assert.equal(await marketInstance.getMarketBalance({from:acc}),remainder);//600 remaining tokens, since user had 1000 before
    });
    it("account 2 bids on the auctioned NFT with the price of 500", async() =>{
        let id = 1;
        let acc = accounts[2];
        let price = 500;
        let remainder = 1000 - price;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.bid(nftAddress,id,price,{from:acc});
        assert.equal(await marketInstance.getAuctionInfoPrice(nftAddress,id,{from:acc}),price);
        assert.equal(await marketInstance.getMarketBalance({from:acc}),remainder);//500 remaining tokens, since user had 1000 before
        assert.equal(await marketInstance.getMarketBalance({from:accounts[1]}),1000) // user should receive their tokens back after someone bids.

    });
    it("account 1 tries to bid 100 but fails since it is not enough", async() =>{
        let id = 1;
        let acc = accounts[1];
        let price = 100;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.bid(nftAddress,id,price,{from:acc}));
        assert.equal(await marketInstance.getMarketBalance({from:accounts[1]}),1000) // user should not be able to bid.
    });
    it("account 0 tries to bid 600 but fails since they are the old owner", async() =>{
        let id = 1;
        let acc = accounts[0];
        let price = 600;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.bid(nftAddress,id,price,{from:acc}));
    });
    it("account 3 tries to bid 600 but fails since they dont have enough money on market", async() =>{
        let id = 1;
        let acc = accounts[3];
        let price = 600;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.bid(nftAddress,id,price,{from:acc}));
    });
    it("account 2 tries to end auction before it ends and fails", async() =>{
        let id = 1;
        let acc = accounts[2];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.endAuction(nftAddress,id,{from:acc}));
    });
    it("account 2 tries to start auction with account 1's nft and fails", async() =>{
        let id = 1;
        let acc = accounts[2];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.startAuction(nftAddress,id,123,{from:acc}));
    });
    it("account 0 starts an auction with their deposited NFT with id 4 with starting price of 123", async() =>{
        let id = 4;
        let acc = accounts[0];
        let startPrice = 123;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.startAuction(nftAddress,id,startPrice,{from:acc});
        assert.equal(await marketInstance.getAuctionInfoPrice(nftAddress,id,{from:acc}),startPrice);
    });
    it("account 0 tries to start an auction with their deposited NFT with id 4 with starting price of 123 but fails since it has already been started.", async() =>{
        let id = 4;
        let acc = accounts[0];
        let startPrice = 123;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.startAuction(nftAddress,id,startPrice,{from:acc}));
    });
    it("account 0 starts a regular sale with their deposited NFT with id 4 with starting price of 123 but fails since there already is an auction going on for that NFT ", async()=>{
        let id = 4;
        let acc = accounts[0];
        let startPrice = 123;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await truffleAssert.reverts(marketInstance.sellRegular(nftAddress,id,startPrice,{from:acc}));

    });
    it("account 1 starts a regular sale with their deposited NFT with id 2, account 2 buys that nft", async()=>{
        let id = 2;
        let acc = accounts[1];
        let buyerAcc = accounts[2];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.sellRegular(nftAddress,id,123,{from:acc});
        await marketInstance.buyRegular(nftAddress,id,{from:buyerAcc});
        assert.equal(await marketInstance.getUserNftBalance(nftAddress,id,{from:buyerAcc}),true);
    });
    it("account 2 starts a regular sale with their deposited NFT with id 1, account 1 buys that nft", async()=>{
        let id = 2;
        let acc = accounts[2];
        let buyerAcc = accounts[1];
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.sellRegular(nftAddress,id,123,{from:acc});
        await marketInstance.buyRegular(nftAddress,id,{from:buyerAcc});
        assert.equal(await marketInstance.getUserNftBalance(nftAddress,id,{from:buyerAcc}),true);
    });
    it("account 1 starts an auction with their deposited NFT with id 2", async()=>{
        let id = 2;
        let acc = accounts[1];
        let startPrice = 123;
        let NFTinstance = await NFT.deployed();
        let marketInstance = await market.deployed();
        let nftAddress = NFTinstance.address;
        await marketInstance.startAuction(nftAddress,id,startPrice,{from:acc})
    });


});