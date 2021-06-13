const { expectRevert } = require('@openzeppelin/test-helpers');
const Dai = artifacts.require('mock/Dai.sol');
const Bat = artifacts.require('mock/Bat.sol');
const Rep = artifacts.require('mock/Rep.sol');
const Zrx = artifacts.require('mock/Zrx.sol');
const Dex = artifacts.require('Dex.sol');

const SIDE = {
  BUY: 0,
  SELL: 1,
};

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

  it('should create limit order', async () => {
    await dex.deposit(web3.utils.toWei('100'), DAI, { from: trader1 });

    await dex.createLimitOrder(REP, web3.utils.toWei('10'), 10, SIDE.BUY, {
      from: trader1,
    });

    const buyOrders = await dex.getOrders(REP, SIDE.BUY);
    const sellOrders = await dex.getOrders(REP, SIDE.SELL);

    assert(buyOrders.length === 1);
    assert(buyOrders[0].trader === trader1);
    assert(buyOrders[0].amount === web3.utils.toWei('10'));
    assert(buyOrders[0].price === '10');
    assert(buyOrders[0].ticker === web3.utils.padRight(REP, 64));
    assert(sellOrders.length === 0);
  });

  it('should sort limit order by price ', async () => {
    await dex.deposit(web3.utils.toWei('1000'), DAI, { from: trader1 });
    await dex.deposit(web3.utils.toWei('1000'), DAI, { from: trader2 });

    await dex.createLimitOrder(REP, web3.utils.toWei('10'), 10, SIDE.BUY, {
      from: trader1,
    });

    await dex.createLimitOrder(REP, web3.utils.toWei('10'), 11, SIDE.BUY, {
      from: trader2,
    });

    await dex.createLimitOrder(REP, web3.utils.toWei('10'), 9, SIDE.BUY, {
      from: trader2,
    });

    const buyOrders = await dex.getOrders(REP, SIDE.BUY);
    const sellOrders = await dex.getOrders(REP, SIDE.SELL);

    assert(sellOrders.length === 0);
    assert(buyOrders.length === 3);
    assert(buyOrders[0].trader === trader2);
    assert(buyOrders[1].trader === trader1);
    assert(buyOrders[2].trader === trader2);
    assert(buyOrders[0].price === '11');
    assert(buyOrders[1].price === '10');
    assert(buyOrders[2].price === '9');
  });

  it('should NOT create limit order when token does not exist', async () => {
    await expectRevert(
      dex.createLimitOrder(
        web3.utils.fromAscii('Not Exists'),
        web3.utils.toWei('100'),
        10,
        SIDE.BUY,
      ),
      'This token does not exist',
    );
  });

  it('should NOT create limit order when token is DAI', async () => {
    await expectRevert(
      dex.createLimitOrder(DAI, web3.utils.toWei('100'), 10, SIDE.BUY),
      'cannot trade DAI',
    );
  });

  it('should NOT create limit order when balance is too low', async () => {
    await dex.deposit(web3.utils.toWei('10'), DAI, { from: trader1 });

    await expectRevert(
      dex.createLimitOrder(REP, web3.utils.toWei('100'), 10, SIDE.BUY),
      'DAI balance too low',
    );
  });

  it('should NOT create limit order when user have not enough token', async () => {
    await expectRevert(
      dex.createLimitOrder(REP, web3.utils.toWei('100'), 10, SIDE.SELL),
      'token balance too low',
    );
  });

  it('should NOT create limit order when user have not enough token', async () => {
    await expectRevert(
      dex.createLimitOrder(REP, web3.utils.toWei('100'), 100, SIDE.BUY),
      'DAI balance too low',
    );
  });

  it('should create market order and match agaist existing limit order', async () => {
    await dex.deposit(web3.utils.toWei('100'), DAI, { from: trader1 });
    await dex.deposit(web3.utils.toWei('100'), REP, { from: trader2 });

    await dex.createLimitOrder(REP, web3.utils.toWei('10'), 10, SIDE.BUY, {
      from: trader1,
    });

    await dex.createMarketOrder(REP, web3.utils.toWei('5'), SIDE.SELL, {
      from: trader2,
    });

    const balances = await Promise.all([
      dex.traderBalances(trader1, DAI),
      dex.traderBalances(trader1, REP),
      dex.traderBalances(trader2, DAI),
      dex.traderBalances(trader2, REP),
    ]);

    const orders = await dex.getOrders(REP, SIDE.BUY);
    assert(orders[0].filled === web3.utils.toWei('5'));
    assert(balances[0].toString() === web3.utils.toWei('50'));
    assert(balances[1].toString() === web3.utils.toWei('5'));
    assert(balances[2].toString() === web3.utils.toWei('50'));
    assert(balances[3].toString() === web3.utils.toWei('95'));
  });

  it('should NOT create market order when token does not exist', async () => {
    await expectRevert(
      dex.createMarketOrder(
        web3.utils.fromAscii('Not Exists'),
        web3.utils.toWei('100'),
        SIDE.BUY,
      ),
      'This token does not exist',
    );
  });

  it('should NOT create market order when token is DAI', async () => {
    await expectRevert(
      dex.createMarketOrder(DAI, web3.utils.toWei('100'), SIDE.BUY),
      'cannot trade DAI',
    );
  });

  it('should NOT create market order when user have not enough token', async () => {
    await expectRevert(
      dex.createMarketOrder(REP, web3.utils.toWei('100'), SIDE.SELL),
      'token balance too low',
    );
  });

  it('should not create market order when user have not enough DAI to buy', async () => {
    await dex.deposit(web3.utils.toWei('100'), REP, { from: trader1 });

    await dex.createLimitOrder(REP, web3.utils.toWei('100'), 10, SIDE.SELL, {
      from: trader1,
    });

    await expectRevert(
      dex.createMarketOrder(REP, web3.utils.toWei('100'), SIDE.BUY),
      'dai balance too low',
      { from: trader2 },
    );
  });
});
