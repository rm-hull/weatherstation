import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts/highstock';
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
  created_at: string
  updated_at: string
  last_entry_id: number
};


const numResults = 2880;

const tzOffset = new Date().getTimezoneOffset() * 60000;

const getChartDate = (d: string)  => 
  Date.UTC(
    parseInt(d.substring(0, 4)),
    parseInt(d.substring(5, 7)) - 1,
    parseInt(d.substring(8, 10)),
    parseInt(d.substring(11, 13)),
    parseInt(d.substring(14, 16)),
    parseInt(d.substring(17, 19))) - tzOffset;

const getSeriesData = (feeds: Feed[], index: Index): number[][] => 
  feeds.map(f => [getChartDate(f.created_at), parseFloat(f[index])]);

  
const getSeriesName = (channel: Channel | undefined, index: Index): string | undefined => {
    if (!channel) return undefined;
    const pos = channel[index].indexOf(' (');
    return pos > 0 ? channel[index].substr(0, pos) : channel[index];
}
  
const getSeriesUnit = (channel: Channel | undefined, index: Index): string | undefined => {
  if (!channel) return undefined;
  const startPos = channel[index].indexOf(' (');
  if (startPos < 0) return undefined;
  const endPos = channel[index].indexOf(')', startPos + 2);
  return endPos > 0 ? channel[index].substr(startPos + 2, endPos - startPos - 2) : undefined;
  
}

export type ThingspeakChartProps = {
  channelId: number
  rounding: number | undefined
  apiKey: string
}
  
const ThingspeakChart = (props: ThingspeakChartProps) => {
  
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [channel, setChannel] = useState<Channel | undefined>();

  useEffect(() => {
    const url = `https://api.thingspeak.com/channels/${props.channelId}/feed.json?round=${props.rounding}&results=${numResults}&api_key=${props.apiKey}&_=${Date.now()}`
    fetch(url)
      .then(data => data.json())
      .then(({feeds, channel}) => {
        setFeeds(feeds);
        setChannel(channel);
      });
  }, [props.channelId, props.rounding, props.apiKey]);
  
  useRecurringTimer(() => {
    const url = `https://api.thingspeak.com/channels/${props.channelId}/feed/last.json?round=${props.rounding}&api_key=${props.apiKey}&location=false&_=${Date.now()}`
    fetch(url)
      .then(data => data.json())
      .then((currentFeed: Feed) => {
        if (channel && currentFeed.entry_id > channel.last_entry_id) {
          setFeeds([...feeds, currentFeed]);  
          setChannel({
            ...channel, 
            updated_at: currentFeed.created_at, 
            last_entry_id: currentFeed.entry_id
          });
        }
      });
  }, 30000);
  
  if (!channel) {
    return (
      <div className="please-wait">
        Loading: please wait...
      </div>
    );
  }
  
  return (
    <HighchartsReact
      highcharts={Highcharts}
      allowChartUpdate
      containerProps={{style: {height: '600px'}}}
      options={{
        title: channel?.name,
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
          enabled: true,
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
          { id: 'T', title: { text: channel?.field1 }, opposite: false, lineWidth: 1, min: 5, max: 30, labels: { format: '{value:.2f}' } },
          { id: 'H', title: { text: channel?.field2 }, opposite: true, lineWidth: 1, min: 0, max: 100, labels: { format: '{value:.2f}' } },
          { id: 'P', title: { text: channel?.field3 }, opposite: true, lineWidth: 1, min: 972, max: 1032, labels: { format: '{value:.2f}' } }
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
          enabled: !!channel
        },
        navigator: {
          baseSeries: 0,
          series: {
            includeInCSVExport: false
          }
        },
        tooltip: {
          crosshairs: [true, false]
        },
        series: [{
          index: 0,
          yAxis: 'T',
          name: getSeriesName(channel, 'field1'),
          data: getSeriesData(feeds, 'field1'),
          tooltip: {
            valueDecimals: 2,
            valueSuffix: ` ${getSeriesUnit(channel, 'field1')}`
          }
        },
        {
          index: 1,
          yAxis: 'H',
          name: getSeriesName(channel, 'field2'),
          data: getSeriesData(feeds, 'field2'),
          tooltip: {
            valueDecimals: 1,
            valueSuffix: ` ${getSeriesUnit(channel, 'field2')}`
          }
        },
        {
          index: 2,
          yAxis: 'P',
          name: getSeriesName(channel, 'field3'),
          data: getSeriesData(feeds, 'field3'),
          tooltip: {
            valueDecimals: 1,
            valueSuffix:  ` ${getSeriesUnit(channel, 'field3')}`
          }
        },
      ]
      }}
    />
  );
}

export default ThingspeakChart;
