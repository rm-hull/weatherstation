import React from 'react';
import './App.css';

import ThingspeakChart from './ThingspeakChart';

const App = () => {
    
  return (
    <div className="App">
        <ThingspeakChart apiKey="XXXX" channelId={164534} rounding={3} />
    </div>
  );
}

export default App;
