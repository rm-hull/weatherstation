// Webpage Javascript to chart multiple ThingSpeak channels on two axis with navigator, load historical data, and export cvs data.
// Public Domain, by turgo.
//  The charting library is called HighStock.  It is awesome!  HighSoft, the owners say,
//   "Do you want to use Highstock for a personal or non-profit project? Then you can use Highchcarts for
//   free under the  Creative Commons Attribution-NonCommercial 3.0 License. "
var dynamicChart;
var channelsLoaded = 0;
// put your ThingSpeak Channel#, Channel Name, and API keys here.
// fieldList shows which field you want to load, and which axis to display that field on,
// the 'T' Temperature left axis, or the 'O' Other right axis.
var channelKeys = [];
channelKeys.push({
  channelNumber: 164534,
  name: 'Living Room',
  key: 'XXXXXXXXXXXXXXXX',
  fieldList: [{
    field: 1,
    axis: 'T'
  }, {
    field: 2,
    axis: 'H'
  }, {
    field: 3,
    axis: 'P'
  }]
});
// user's timezone offset
var myOffset = new Date().getTimezoneOffset();

// converts date format from JSON
function getChartDate(d) {
  // get the data using javascript's date object (year, month, day, hour, minute, second)
  // months in javascript start at 0, so remember to subtract 1 when specifying the month
  // offset in minutes is converted to milliseconds and subtracted so that chart's x-axis is correct
  return Date.UTC(d.substring(0, 4), d.substring(5, 7) - 1, d.substring(8, 10), d.substring(11, 13), d.substring(14, 16), d.substring(17, 19)) - (myOffset * 60000);
}


//  This is where the chart is generated.
$(document).ready(function() {
  $.ajaxSetup({ cache: false });

  //Add Channel Load Menu
  var menu = document.getElementById("channel-select");
  for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++)
  {
    var menuOption = new Option(channelKeys[channelIndex].name, channelIndex);
    menu.options.add(menuOption, channelIndex);
  }
  var last_date; // variable for the last date added to the chart
  //make series numbers for each field
  var seriesCounter = 0
  for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
  {
    for (var fieldIndex = 0; fieldIndex < channelKeys[channelIndex].fieldList.length; fieldIndex++) // iterate through each channel
    {
      channelKeys[channelIndex].fieldList[fieldIndex].series = seriesCounter;
      seriesCounter++;
    }
  }
  //make calls to load data from each channel into channelKeys array now
  // draw the chart when all the data arrives, later asyncronously add history
  for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
  {
    channelKeys[channelIndex].loaded = false;
    loadThingSpeakChannel(channelIndex, channelKeys[channelIndex].channelNumber, channelKeys[channelIndex].key, channelKeys[channelIndex].fieldList);

  }

  // load the most recent 2500 points (fast initial load) from a ThingSpeak channel into a data[] array and return the data[] array
  function loadThingSpeakChannel(sentChannelIndex, channelNumber, key, sentFieldList) {
    var fieldList = sentFieldList;
    var channelIndex = sentChannelIndex;
    // get the Channel data with a webservice call
    $.getJSON('https://api.thingspeak.com/channels/' + channelNumber + '/feed.json?round=3&results=721&api_key=' + key, function(data) {
        // if no access
        if (data == '-1') {
          $('#chart-container').append('This channel is not public.  To embed charts, the channel must be public or a read key must be specified.');
          console.log('Thingspeak Data Loading Error');
        }
        for (var fieldIndex = 0; fieldIndex < fieldList.length; fieldIndex++) // iterate through each field
        {
          fieldList[fieldIndex].data = [];
          var field = "field" + fieldList[fieldIndex].field;
          for (var h = 0; h < data.feeds.length; h++) // iterate through each feed (data point)
          {
            var v = data.feeds[h][field];
            var p = [getChartDate(data.feeds[h].created_at), parseFloat(v)];
            if (!isNaN(p[1])) {
              fieldList[fieldIndex].data.push(p);
            }
          }
          fieldList[fieldIndex].name = data.channel[field];
        }
        console.log('getJSON field name:', fieldList[0].name);
        channelKeys[channelIndex].fieldList = fieldList;
        channelKeys[channelIndex].loaded = true;
        channelsLoaded++;
        console.log('channels Loaded:', channelsLoaded);
        console.log('channel index:', channelIndex);
        if (channelsLoaded == channelKeys.length) {
          $("#controls").show();
          createChart();
        }
      })
      .fail(function() {
        alert('getJSON request failed! ');
      });
  }

  // create the chart when all data is loaded
  function createChart() {
    // specify the chart options
    var chartOptions = {
      colors: ['#7cb5ec', '#492970', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
      chart: {
        renderTo: 'chart-container',
        zoomType: 'xy',
        events: {
          load: function() {

            setInterval(function() {
              // If the update checkbox is checked, get latest data every 15 seconds and add it to the chart
              if (document.getElementById("auto-update").checked) {
                for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
                {
                  (function(channelIndex) {
                    // get the data with a webservice call
                    $.getJSON('https://api.thingspeak.com/channels/' + channelKeys[channelIndex].channelNumber + '/feed/last.json?round=3&location=false&api_key=' + channelKeys[channelIndex].key, function(data) {
                      for (var fieldIndex = 0; fieldIndex < channelKeys[channelIndex].fieldList.length; fieldIndex++) {
                        // if data exists
                        var field = "field" + channelKeys[channelIndex].fieldList[fieldIndex].field;
                        if (data && data[field]) {
                          var chartSeriesIndex = channelKeys[channelIndex].fieldList[fieldIndex].series;
                          var v = data[field];
                          var p = [getChartDate(data.created_at), parseFloat(v)];
                          // get the last date if possible
                          if (dynamicChart.series[chartSeriesIndex].data.length > 0) {
                            last_date = dynamicChart.series[chartSeriesIndex].data[dynamicChart.series[chartSeriesIndex].data.length - 1].x;
                          }
                          // if a numerical value exists and it is a new date, add it
                          if (!isNaN(p[1]) && (p[0] != last_date)) {
                            dynamicChart.series[chartSeriesIndex].addPoint(p, true, false /* shift */);
                          }
                        }
                      }
                    });
                  })(channelIndex);
                }
              }
            }, 15000);
          }
        }
      },
      rangeSelector: {
        buttons: [{
          count: 30,
          type: 'minute',
          text: '30M'
        }, {
          count: 2,
          type: 'hour',
          text: '2H'
        }, {
          count: 6,
          type: 'hour',
          text: '6H'
        }, {
          count: 12,
          type: 'hour',
          text: '12H'
        }, {
          count: 1,
          type: 'day',
          text: 'D'
        }, {
          count: 1,
          type: 'week',
          text: 'W'
        }, {
          count: 1,
          type: 'month',
          text: 'M'
        }, {
          count: 1,
          type: 'year',
          text: 'Y'
        }, {
          type: 'all',
          text: 'All'
        }],
        inputEnabled: true,
        selected: 2
      },
      title: {
        text: ''
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
        ordinal: false,
        min: Date.UTC(2016, 11, 23),
        dateTimeLabelFormats: {
          hour: '%l %p',
          minute: '%l:%M %p'
        },
        title: {
          text: 'test'
        }
      },
      yAxis: [{
        id: 'T',
        title: {
          text: 'Temperature (°C)'
        },
        opposite: false,
        lineWidth: 1,
        labels: {
            format: '{value:.2f}'
        }
      }, {
        id: 'H',
        title: {
          text: 'Humidity (% rH)'
        },
        opposite: true,
        lineWidth: 1,
        labels: {
            format: '{value:.2f}'
        }
      }, {
        id: 'P',
        title: {
          text: 'Pressure (hPa)'
        },
        opposite: true,
        labels: {
            format: '{value:.2f}'
        }
      }],
      exporting: {
        enabled: true,
        csv: {
          dateFormat: '%d/%m/%Y %I:%M:%S %p'
        }
      },
      legend: {
        enabled: true
      },
      navigator: {
        baseSeries: 0, //select which series to show in history navigator, First series is 0
        series: {
          includeInCSVExport: false
        }
      },
      series: []
    };

    // add all Channel data to the chart
    for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
    {
      for (var fieldIndex = 0; fieldIndex < channelKeys[channelIndex].fieldList.length; fieldIndex++) // add each field
      {
        console.log('Channel ' + channelIndex + ' field ' + fieldIndex);
        var field = channelKeys[channelIndex].fieldList[fieldIndex];
        var nameParts = /(.*) \((.*)\)/g.exec(field.name);
        chartOptions.series.push({
          data: field.data,
          index: field.series,
          yAxis: field.axis,
          name: field.name,
          tooltip: {
            valueDecimals: 3,
            valueSuffix: ' ' + nameParts[2]
          }
        });
      }
    }
    // set chart labels here so that decoding occurs properly
    //chartOptions.title.text = data.channel.name;
    chartOptions.xAxis.title.text = 'Date';

    // draw the chart
    dynamicChart = new Highcharts.StockChart(chartOptions);

    // update series number to account for the navigator series (The historical series at the bottom) which is the first series.
    for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
    {
      for (var fieldIndex = 0; fieldIndex < channelKeys[channelIndex].fieldList.length; fieldIndex++) // and each field
      {
        for (var seriesIndex = 0; seriesIndex < dynamicChart.series.length; seriesIndex++) // compare each series name
        {
          if (dynamicChart.series[seriesIndex].name == channelKeys[channelIndex].fieldList[fieldIndex].name) {
            channelKeys[channelIndex].fieldList[fieldIndex].series = seriesIndex;
          }
        }
      }
    }
    // add all history
    console.log('Channels: ', channelKeys.length);
    for (var channelIndex = 0; channelIndex < channelKeys.length; channelIndex++) // iterate through each channel
    {
      console.log('channelIndex: ', channelIndex);
      (function(channelIndex) {
        //load only 1 set of 8000 points
        loadChannelHistory(channelIndex, channelKeys[channelIndex].channelNumber, channelKeys[channelIndex].key, channelKeys[channelIndex].fieldList);
      })(channelIndex);
    }
  }
});

function loadOneChannel() {
  // load a channel selected in the popUp menu.
  var selectedChannel = document.getElementById("channel-select");
  var channelIndex = selectedChannel.selectedIndex;
  loadChannelHistory(channelIndex, channelKeys[channelIndex].channelNumber, channelKeys[channelIndex].key, channelKeys[channelIndex].fieldList);
}

// load next 8000 points from a ThingSpeak channel and addPoints to a series
function loadChannelHistory(sentChannelIndex, channelNumber, key, sentFieldList) {
  dynamicChart.showLoading("Loading History..." );
  var fieldList = sentFieldList;
  var channelIndex = sentChannelIndex;
  var first_Date = new Date();
  if (typeof fieldList[0].data[0] != "undefined")      first_Date.setTime(fieldList[0].data[0][0]);
  else if (typeof fieldList[1].data[0] != "undefined") first_Date.setTime(fieldList[1].data[0][0]);
  else if (typeof fieldList[2].data[0] != "undefined") first_Date.setTime(fieldList[2].data[0][0]);
  else if (typeof fieldList[3].data[0] != "undefined") first_Date.setTime(fieldList[3].data[0][0]);
  else if (typeof fieldList[4].data[0] != "undefined") first_Date.setTime(fieldList[4].data[0][0]);
  else if (typeof fieldList[5].data[0] != "undefined") first_Date.setTime(fieldList[5].data[0][0]);
  else if (typeof fieldList[6].data[0] != "undefined") first_Date.setTime(fieldList[6].data[0][0]);
  else if (typeof fieldList[7].data[0] != "undefined") first_Date.setTime(fieldList[7].data[0][0]);
  var end = first_Date.toJSON();
  console.log('earliest date:', end);
  console.log('sentChannelIndex:', sentChannelIndex);
  // get the Channel data with a webservice call
  $.getJSON('https://api.thingspeak.com/channels/' + channelNumber + '/feed.json?round=3&start=2016-11-23T00:00:00&end=' + end + '&api_key=' + key, function(data) {
    dynamicChart.hideLoading();
    // if no access
    if (data == '-1') {
      $('#chart-container').append('This channel is not public.  To embed charts, the channel must be public or a read key must be specified.');
      console.log('Thingspeak Data Loading Error');
    }
    for (var fieldIndex = 0; fieldIndex < fieldList.length; fieldIndex++) // iterate through each field
    {
      for (var h = 0; h < data.feeds.length; h++) // iterate through each feed (data point)
      {
        var field = "field" + fieldList[fieldIndex].field;
        var v = data.feeds[h][field];
        var p = [getChartDate(data.feeds[h].created_at), parseFloat(v)];
        if (!isNaN(p[1])) {
          fieldList[fieldIndex].data.push(p);
        }
      }
      fieldList[fieldIndex].data.sort(function(a, b) {
        return a[0] - b[0]
      });
      dynamicChart.series[fieldList[fieldIndex].series].setData(fieldList[fieldIndex].data, false);
    }
    channelKeys[channelIndex].fieldList = fieldList;
    dynamicChart.redraw()
    console.log('channel index:', channelIndex);
  });
}
