const Dai = artifacts.require('mock/Dai.sol');
const Bat = artifacts.require('mock/Bat.sol');
const Rep = artifacts.require('mock/Rep.sol');
const Zrx = artifacts.require('mock/Zrx.sol');
const Dex = artifacts.require('Dex.sol');

const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map((ticker) =>
  web3.utils.fromAscii(ticker),
);

module.exports = async function (deployer) {
  await Promise.all(
    [Dai, Bat, Rep, Zrx, Dex].map((contract) => deployer.deploy(contract)),
  );

  const [dai, bat, rep, zrx, dex] = await Promise.all(
    [Dai, Bat, Rep, Zrx, Dex].map((contract) => contract.deployed()),
  );

  await Promise.all([
    dex.addToken(DAI, dai.address),
    dex.addToken(BAT, bat.address),
    dex.addToken(REP, rep.address),
    dex.addToken(ZRX, zrx.address),
  ]);
};
