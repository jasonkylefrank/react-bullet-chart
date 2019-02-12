import React, { Component } from 'react';
import './App.scss';
import BulletChart from './components/BulletChart/BulletChart';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          Bullet chart demos
        </header>
        <BulletChart
          values={[{value: 10}, {value: 4}]}
          secondaryValues={[{value: 3}, {value: 9}]}
          primaryTarget={{value: 8}}
          scale={{value: 20}}
        />
      </div>
    );
  }
}

export default App;
