import React from 'react';
import Dropdown from './Dropdown.js';

function Header({ user, tokens, contracts, selectToken }) {
  return (
    <header id="header" className="row">
      <div className="row">
        <div className="col-sm-3 flex">
          <Dropdown items={tokens.map(token => ({
            label: token.ticker,
            value: token
          }))}
          activeItem={
            label: user.selectedToken.ticker,
            value: user.selectedToken
          }
          onSelect={selectToken}
          ></Dropdown>
        </div>
        <div className="col-sm-9">
          <h1 class="header-title">
            Dex -{' '}
            <span className="contract-address">
              Contract address:{' '}
              <span className="address">{contracts.dex.options.address}</span>
            </span>
          </h1>
        </div>
      </div>
    </header>
  );
}
