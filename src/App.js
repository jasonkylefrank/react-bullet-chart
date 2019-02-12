import React, { Component } from 'react';
import './App.scss';
import BulletChart from './components/BulletChart';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          Bullet chart demos
        </header>
        <BulletChart testProp="123" />
      </div>
    );
  }
}

export default App;
