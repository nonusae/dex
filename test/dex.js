const Dai = artifacts.require('mock/Dai.sol');
const Bat = artifacts.require('mock/Bat.sol');
const Rep = artifacts.require('mock/Rep.sol');
const Zrx = artifacts.require('mock/Zrx.sol');
const Dex = artifacts.require('Dex.sol');

contract('Dex', () => {
  let dai, bat, rep, zrx;
  const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map((ticker) =>
    web3.utils.fromAscii(ticker),
  );

  beforeEach(async () => {
    [dai, bat, rep, zrx] = await Promise.all([
      Dai.new(),
      Bat.new(),
      Rep.new(),
      Zrx.new(),
    ]);

    const dex = await Dex.new();
    await Promise.all([
      dex.addToken(DAI, dai.address),
      dex.addToken(BAT, bat.address),
      dex.addToken(REP, rep.address),
      dex.addToken(ZRX, zrx.address),
    ]);
  });
});
