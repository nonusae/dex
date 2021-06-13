const { expectRevert } = require('@openzeppelin/test-helpers');
const Dai = artifacts.require('mock/Dai.sol');
const Bat = artifacts.require('mock/Bat.sol');
const Rep = artifacts.require('mock/Rep.sol');
const Zrx = artifacts.require('mock/Zrx.sol');
const Dex = artifacts.require('Dex.sol');

contract('Dex', (accounts) => {
  let dai, bat, rep, zrx, dex;
  const [trader1, trader2] = [accounts[1], accounts[2]];
  const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map((ticker) =>
    web3.utils.fromAscii(ticker),
  );

  // Initialization
  beforeEach(async () => {
    [dai, bat, rep, zrx] = await Promise.all([
      Dai.new(),
      Bat.new(),
      Rep.new(),
      Zrx.new(),
    ]);

    dex = await Dex.new();
    await Promise.all([
      dex.addToken(DAI, dai.address),
      dex.addToken(BAT, bat.address),
      dex.addToken(REP, rep.address),
      dex.addToken(ZRX, zrx.address),
    ]);

    const amount = web3.utils.toWei('1000');
    const seedTokenBalance = async (token, trader) => {
      await token.faucet(trader, amount);
      await token.approve(dex.address, amount, { from: trader });
    };

    await Promise.all(
      [dai, bat, rep, zrx].map((token) => seedTokenBalance(token, trader1)),
    );

    await Promise.all(
      [dai, bat, rep, zrx].map((token) => seedTokenBalance(token, trader2)),
    );
  });

  //Deposit
  it('should deposit token', async () => {
    const amount = web3.utils.toWei('100');

    await dex.deposit(amount, DAI, { from: trader1 });

    const balance = await dex.traderBalances(trader1, DAI);
    assert(balance.toString() === amount);
  });

  it('should not deposit token if token do not exist', async () => {
    await expectRevert(
      dex.deposit(web3.utils.toWei('100'), web3.utils.fromAscii('Not Exists'), {
        from: trader1,
      }),
      'This token does not exist',
    );
  });

  it('should widthdraw token', async () => {
    const amount = web3.utils.toWei('100');

    await dex.deposit(amount, DAI, { from: trader1 });

    await dex.withdraw(amount, DAI, { from: trader1 });

    const [balanceDex, balanceDai] = await Promise.all([
      dex.traderBalances(trader1, DAI),
      dai.balanceOf(trader1),
    ]);

    assert(balanceDex.isZero());
    assert(balanceDai.toString() === web3.utils.toWei('1000'));
  });

  it('should not withdraw token if token does not exist', async () => {
    await expectRevert(
      dex.withdraw(
        web3.utils.toWei('100'),
        web3.utils.fromAscii('Not Exists'),
        {
          from: trader1,
        },
      ),
      'This token does not exist',
    );
  });

  it('should not withdraw token if balance is too low', async () => {
    await dex.deposit(web3.utils.toWei('100'), DAI, { from: trader1 });
    await expectRevert(
      dex.withdraw(web3.utils.toWei('1000'), DAI, {
        from: trader1,
      }),
      'Not enough balances',
    );
  });
});
