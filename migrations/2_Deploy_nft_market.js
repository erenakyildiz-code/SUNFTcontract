const token = artifacts.require("SUcoin");
const NFT = artifacts.require("NonFungibleToken");
const market = artifacts.require("Market");
module.exports = function(deployer){
    deployer.deploy(token).then(
        async ()=> {
            await token.deployed();
            deployer.deploy(market,token.address);
            let instance = await token.deployed();
            let accounts = await web3.eth.getAccounts();
            await instance.transfer(accounts[1],10000,{from:accounts[0]});
            await instance.transfer(accounts[2],10000,{from:accounts[0]});
            await instance.transfer(accounts[3],10000,{from:accounts[0]});
            
        }
    );
    deployer.deploy(NFT).then(
        async()=>{
            await NFT.deployed();
            let NFTinstance = await NFT.at(NFT.address);
            accounts = await web3.eth.getAccounts();
            await NFTinstance.safeMint(accounts[0],1,{from:accounts[0]});
            await NFTinstance.safeMint(accounts[1],2,{from:accounts[0]});
            await NFTinstance.safeMint(accounts[2],3,{from:accounts[0]});
            await NFTinstance.safeMint(accounts[0],4,{from:accounts[0]});
        }
    );
    
};
