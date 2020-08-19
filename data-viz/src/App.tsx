import React, { useState, useEffect } from 'react';
import './App.css';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import { useRecurringTimer } from './timer';

require("highcharts/modules/exporting")(Highcharts);
require("highcharts/modules/export-data")(Highcharts);

type Index = 'field1' | 'field2' | 'field3'
type FromIndex = { [index in Index]: string }

interface Feed extends FromIndex {
  entry_id: number
  created_at: string
}

interface Channel extends FromIndex {
  id: number
  name: string
  latitude: string
  longitude: string
  field1: string
  field2: string
  field3: string
  created_at: string
  updated_at: string
  last_entry_id: number
};

const channelId = 164534;
const apiKey = undefined;
const rounding = 3;
const numResults = 2160;

const tzOffset = new Date().getTimezoneOffset() * 60000;

const getChartDate = (d: string)  => 
  Date.UTC(
    parseInt(d.substring(0, 4)),
    parseInt(d.substring(5, 7)) - 1,
    parseInt(d.substring(8, 10)),
    parseInt(d.substring(11, 13)),
    parseInt(d.substring(14, 16)),
    parseInt(d.substring(17, 19))) - tzOffset;

const getSeries = (feeds: Feed[], selector: (fi: FromIndex) => string): number[][] => 
  feeds.map(f => [getChartDate(f.created_at), parseFloat(selector(f))]);

const App = () => {
  
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [channel, setChannel] = useState<Channel | undefined>();
  
  useEffect(() => {
    const url = `https://api.thingspeak.com/channels/${channelId}/feed.json?round=${rounding}&results=${numResults}&api_key=${apiKey}&_=${Date.now()}`
    fetch(url)
    .then(data => data.json())
    .then(({feeds, channel}) => {
      setFeeds(feeds);
      setChannel(channel);
    });
  }, []);
  
  useRecurringTimer(() => {
    const url = `https://api.thingspeak.com/channels/${channelId}/feed/last.json?round=${rounding}&api_key=${apiKey}&location=false&_=${Date.now()}`
    fetch(url)
    .then(data => data.json())
    .then((currentFeed: Feed) => {
      const lastFeed = feeds[feeds.length - 1];
      if (currentFeed.entry_id > lastFeed.entry_id) {
        setFeeds(feeds.concat([currentFeed]));        
      }
    });
  }, 30000);
  
  return (
    <div className="App">
        <HighchartsReact
          highcharts={Highcharts}
          allowChartUpdate
          containerProps={{style: {height: '600px'}}}
          options={{
            title: null,
            colors: ['#7cb5ec', '#492970', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
            chart: {
              type: 'spline',
              zoomType: 'xy',
              events: {
                load: function() {
                }
              }
            },
            rangeSelector: {
              buttons: [
                { count: 30, type: 'minute', text: '30M' },
                { count:  2, type: 'hour',   text: '2H' },
                { count:  6, type: 'hour',   text: '6H' },
                { count: 12, type: 'hour',   text: '12H' },
                { count:  1, type: 'day',    text: 'D' },
                { count:  1, type: 'week',   text: 'W' },
                { count:  1, type: 'month',  text: 'M' },
                { count:  1, type: 'year',   text: 'Y' },
                {            type: 'all', text: 'All' }
              ],
              inputEnabled: true,
              selected: 4
            },
            plotOptions: {
              line: {
                gapSize: 5
              },
              series: {
                marker: {
                  radius: 2
                },
                animation: true,
                step: false,
                turboThrehold: 1000,
                borderWidth: 0
              }
            },
            xAxis: {
              type: 'datetime',
              title: {
                text: 'Time'
              }
            },
            yAxis: [
              { id: 'T', title: { text: 'Temperature (°C)' }, opposite: false, lineWidth: 1, min: 5, max: 30, labels: { format: '{value:.2f}' } },
              { id: 'H', title: { text: 'Humidity (% rH)' }, opposite: true, lineWidth: 1, min: 0, max: 100, labels: { format: '{value:.2f}' } },
              { id: 'P', title: { text: 'Pressure (hPa)' }, opposite: true, lineWidth: 1, min: 972, max: 1032, labels: { format: '{value:.2f}' } }
            ],
            exporting: {
              enabled: true,
              csv: {
                dateFormat: '%d/%m/%Y %I:%M:%S %p'
              },
              allowHTML: true,
              buttons: {
                contextButton: {
                  menuItems: ["viewFullscreen"]
                }
              }            
            },
            legend: {
              enabled: true
            },
            navigator: {
              baseSeries: 0,
              series: {
                includeInCSVExport: false
              }
            },
            tooltip: {
              crosshairs: [false, true]
            },
            series: [{
              index: 0,
              yAxis: 'T',
              name: 'Temperature',
              data: getSeries(feeds, f => f.field1),
              tooltip: {
                valueDecimals: 2,
                valueSuffix: ' °C'
              }
            },
            {
              index: 1,
              yAxis: 'H',
              name: 'Humidity',
              data: getSeries(feeds, f => f.field2),
              tooltip: {
                valueDecimals: 1,
                valueSuffix: '  % rH'
              }
            },
            {
              index: 2,
              yAxis: 'P',
              name: 'Pressure',
              data: getSeries(feeds, f => f.field3),
              tooltip: {
                valueDecimals: 1,
                valueSuffix: '  % rH'
              }
            },
          ]
          }}
        />
    </div>
  );
}

export default App;
