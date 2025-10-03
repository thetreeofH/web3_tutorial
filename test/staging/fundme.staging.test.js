const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { devlopmentChains } = require("../../helper-hardhat-config")

devlopmentChains.includes(network.name) ? describe.skip :
    describe("test fundme contract", async function () {
        let fundMe
        let firstAccount
        beforeEach(async function () {
            await deployments.fixture(["all"])
            firstAccount = (await getNamedAccounts()).firstAccount
            const fundMeDeployment = await deployments.get("FundMe")
            fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
        })

        // test fund and getFund successfully
        it("fund and getFund successfully",
            async function () {
                // make sure target reached
                await fundMe.fund({ value: ethers.parseEther("0.5") })
                // make sure window closed
                await new Promise((resolve => setTimeout(resolve, 200 * 1000)))
                // make sure we can get receipt
                const getFundTx = await fundMe.getFund()
                const getFundTxReceipt = await getFundTx.wait()
                // check event
                await expect(getFundTxReceipt)
                    .to.emit(fundMe, "FundWithdrawByOwner")
                    .withArgs(ethers.parseEther("0.5"))

            }
        )

        // test fund and refund successfully
        it("fund and refund successfully",
            async function () {
                // make sure target reached
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                // make sure window closed
                await new Promise((resolve => setTimeout(resolve, 200 * 1000)))
                // make sure we can get receipt
                const refundTx = await fundMe.refund()
                const refundTxReceipt = await refundTx.wait()
                // check event
                await expect(refundTxReceipt)
                    .to.emit(fundMe, "RefundByFunder")
                    .withArgs(ethers.parseEther("0.1"))

            }
        )

    })