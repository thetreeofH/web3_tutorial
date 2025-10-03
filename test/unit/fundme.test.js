const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config")


!devlopmentChains.includes(network.name) ? describe.skip : 
describe("test fundme contract", async function() {
    let fundMe
    let firstAccount
    let fundMeSecond
    let mockV3Aggregator
    beforeEach(async function() {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        const secondAccount = (await getNamedAccounts()).secondAccount
        const fundMeDeployment = await deployments.get("FundMe")
        mockV3Aggregator = await deployments.get("MockV3Aggregator")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
        fundMeSecond = await ethers.getContract("FundMe", secondAccount)
    })
    it("test fundme owner is sender", async function() {
        await fundMe.waitForDeployment();
        const owner = await fundMe.owner();
        assert.equal(owner, firstAccount)
    })
    it("test fundme datafeed", async function() {
        await fundMe.waitForDeployment();
        const dataFeed = await fundMe.getDataFeed();
        assert.equal(dataFeed, mockV3Aggregator.address)
    })

    // test fund
    it("window closed, value greater than minimum, fund failed",
        async function() {
            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            // vaule is greater than minmum eth
            await expect(fundMe.fund({value: ethers.parseEther("0.1")}))
            .to.be.revertedWith("window is closed")

        }
    )

    it("window open, value less than minmum, fund failed",
        async function() {
            // vaule is less than minmum eth
            await expect(fundMe.fund({value: ethers.parseEther("0.01")}))
            .to.be.revertedWith("Send more ETH")
        }
    )

    it("window open, value greater than minmum, fund success",
        async function() {
            // vaule is greater than minmum eth
            await fundMe.fund({value: ethers.parseEther("0.05")})
            const balance = await fundMe.fundersToAmount(firstAccount)
            assert.equal(balance, ethers.parseEther("0.05"))
        }
    )
    

    // test getfund
    // only owner, window closed, target reached
    it("not owner, window open, target reached, getfund failed", 
        async function() {
            // make sure the target is reached
            await fundMe.fund({value: ethers.parseEther("2")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // not owner
            await expect(fundMeSecond.getFund())
            .to.be.revertedWith("this function can only be called by owner")
        }
    )

    // window open, target reached, getfund failed
    it("owner, window open, target reached, getfund failed", 
        async function() {
            // make sure the target is reached
            await fundMe.fund({value: ethers.parseEther("2")})

            // do
            await expect(fundMe.getFund())
            .to.be.revertedWith("window is not closed")
        }
    )

    // window closed, target does not reached, getfund failed
    it("owner, window closed, target does not reached, getfund failed", 
        async function() {
            // make sure the target is not reached
            await fundMe.fund({value: ethers.parseEther("0.05")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // do
            await expect(fundMe.getFund())
            .to.be.revertedWith("Target is not reached")
        }
    )

    // window closed, target reached, getfund success
    it("window closed, target reached, getfund success", 
        async function() {
            // make sure the target is reached
            await fundMe.fund({value: ethers.parseEther("2")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // check event
            await expect(fundMe.getFund())
            .to.emit(fundMe, "FundWithdrawByOwner")
            .withArgs(ethers.parseEther("2"))
        }
    )
    
    // refund
    // window closed, target not reached, funder has blance
    it("window open, target not reached, funder has blance, refund failed", 
        async function() {
            // make sure the target is not reached
            await fundMe.fund({value: ethers.parseEther("0.05")})

            // do
            await expect(fundMe.refund())
            .to.be.revertedWith("window is not closed")
        }
    )

    // window closed, target reached, funder has balance, refund failed
    it("window closed, target reached, funder has balance, refund failed", 
        async function() {
            // make sure the target is reached
            await fundMe.fund({value: ethers.parseEther("2")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // do
            await expect(fundMe.refund())
            .to.be.revertedWith("Target is reached")
        }
    )

    // window closed, target is not reached, funder has not balance, refund failed
    it("window closed, target is not reached, funder has not balance, refund failed", 
        async function() {
            // make sure the target is not reached
            await fundMe.fund({value: ethers.parseEther("0.05")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // do
            await expect(fundMeSecond.refund())
            .to.be.revertedWith("there is no fund for you")
        }
    )

    // window closed, target is not reached, funder has balance, refund success
    it("window closed, target is not reached, funder has balance, refund success", 
        async function() {
            // make sure the target is not reached
            await fundMe.fund({value: ethers.parseEther("0.05")})

            // make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()

            // do
            await expect(fundMe.refund())
            .to.emit(fundMe, "RefundByFunder")
            .withArgs(firstAccount, ethers.parseEther("0.05"))
        }
    )
})