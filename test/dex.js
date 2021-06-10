const Dai = artifacts.require('mock/Dai.sol');
const Bat = artifacts.require('mock/Bat.sol');
const Rep = artifacts.require('mock/Rep.sol');
const Zrx = artifacts.require('mock/Zrx.sol');

contract('Dex', () => {
  let dai, bat, rep, zrx;

  beforeEach(
    async () =>
      ([dai, bat, rep, zrx] = await Promise.all([
        Dai.new(),
        Bat.new(),
        Rep.new(),
        Zrx.new(),
      ])),
  );
});
