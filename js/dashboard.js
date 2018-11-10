var dynamicChart;
var channelsLoaded = 0;
var channel = {
  channelNumber: 164534,
  name: 'Living Room',
  key: 'XXXXXXXXXXXXXXXX',
  fieldList: [
    { field: 1, axis: 'T' },
    { field: 2, axis: 'H' },
    { field: 3, axis: 'P' }
  ]
};

var tzOffset = new Date().getTimezoneOffset() * 60000;

function getChartDate(d) {
  return Date.UTC(
    d.substring(0, 4),
    d.substring(5, 7) - 1,
    d.substring(8, 10),
    d.substring(11, 13),
    d.substring(14, 16),
    d.substring(17, 19)) - tzOffset;
}

$(document).ready(function() {
  $.ajaxSetup({ cache: false });

  var last_date;
  var seriesCounter = 0
  for (var fieldIndex = 0; fieldIndex < channel.fieldList.length; fieldIndex++) {
    channel.fieldList[fieldIndex].series = seriesCounter;
    seriesCounter++;
  }

  channel.loaded = false;
  loadThingSpeakChannel(channel.channelNumber, channel.key, channel.fieldList);

  function loadThingSpeakChannel(channelNumber, key, sentFieldList) {
    var fieldList = sentFieldList;
    $.getJSON('https://api.thingspeak.com/channels/' + channelNumber + '/feed.json?round=3&results=1081&api_key=' + key, function(data) {
        if (data == '-1') {
          $('#chart-container').append('This channel is not public.  To embed charts, the channel must be public or a read key must be specified.');
          console.log('Thingspeak Data Loading Error');
        }

        for (var fieldIndex = 0; fieldIndex < fieldList.length; fieldIndex++) {
          fieldList[fieldIndex].data = [];
          var field = "field" + fieldList[fieldIndex].field;
          for (var h = 0; h < data.feeds.length; h++) {
            var v = data.feeds[h][field];
            var p = [getChartDate(data.feeds[h].created_at), parseFloat(v)];
            if (!isNaN(p[1])) {
              fieldList[fieldIndex].data.push(p);
            }
          }
          fieldList[fieldIndex].name = data.channel[field];
        }
        channel.fieldList = fieldList;
        channel.loaded = true;
        $("#controls").show();
        createChart();
      })
      .fail(function() {
        alert('getJSON request failed! ');
      });
  }

  function updateChannel(channel) {
    $.getJSON('https://api.thingspeak.com/channels/' + channel.channelNumber + '/feed/last.json?round=3&location=false&api_key=' + channel.key, function(data) {
      for (var fieldIndex = 0; fieldIndex < channel.fieldList.length; fieldIndex++) {
        var field = "field" + channel.fieldList[fieldIndex].field;
        if (data && data[field]) {
          var chartSeriesIndex = channel.fieldList[fieldIndex].series;
          var v = data[field];
          var p = [getChartDate(data.created_at), parseFloat(v)];
          if (dynamicChart.series[chartSeriesIndex].data.length > 0) {
            last_date = dynamicChart.series[chartSeriesIndex].data[dynamicChart.series[chartSeriesIndex].data.length - 1].x;
          }
          if (!isNaN(p[1]) && p[0] != last_date) {
            dynamicChart.series[chartSeriesIndex].addPoint(p, true, false /* shift */);
          }
        }
      }
    });
  }

  function createChart() {
    var chartOptions = {
      colors: ['#7cb5ec', '#492970', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
      chart: {
        type: 'spline',
        renderTo: 'chart-container',
        zoomType: 'xy',
        events: {
          load: function() {
            setInterval(function() {
              if (document.getElementById("auto-update").checked) {
                updateChannel(channel);
              }
            }, 30000);
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
        { id: 'T', title: { text: 'Temperature (°C)' }, opposite: false, lineWidth: 1, min: 5, max: 25, labels: { format: '{value:.2f}' } },
        { id: 'H', title: { text: 'Humidity (% rH)' }, opposite: true, lineWidth: 1, min: 0, max: 100, labels: { format: '{value:.2f}' } },
        { id: 'P', title: { text: 'Pressure (hPa)' }, opposite: true, lineWidth: 1, min: 972, max: 1032, labels: { format: '{value:.2f}' } }
      ],
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
        baseSeries: 0,
        series: {
          includeInCSVExport: false
        }
      },
      series: []
    };


    for (var fieldIndex = 0; fieldIndex < channel.fieldList.length; fieldIndex++) {
      var field = channel.fieldList[fieldIndex];
      var nameParts = /(.*) \((.*)\)/g.exec(field.name);
      chartOptions.series.push({
        data: field.data,
        index: field.series,
        yAxis: field.axis,
        name: nameParts[1],
        tooltip: {
          valueDecimals: 3,
          valueSuffix: ' ' + nameParts[2]
        }
      });
    }

    dynamicChart = new Highcharts.StockChart(chartOptions);

    for (var fieldIndex = 0; fieldIndex < channel.fieldList.length; fieldIndex++) {
      for (var seriesIndex = 0; seriesIndex < dynamicChart.series.length; seriesIndex++) {
        if (dynamicChart.series[seriesIndex].name == channel.fieldList[fieldIndex].name) {
          channel.fieldList[fieldIndex].series = seriesIndex;
        }
      }
    }

    loadChannelHistory(channel.channelNumber, channel.key, channel.fieldList);
  }
});

function loadOneChannel() {
  loadChannelHistory(channel.channelNumber, channel.key, channel.fieldList);
}

function loadChannelHistory(channelNumber, key, sentFieldList) {
  dynamicChart.showLoading("Loading History..." );
  var fieldList = sentFieldList;
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
  $.getJSON('https://api.thingspeak.com/channels/' + channelNumber + '/feed.json?round=3&start=2016-11-23T00:00:00&end=' + end + '&api_key=' + key, function(data) {
    dynamicChart.hideLoading();
    if (data == '-1') {
      $('#chart-container').append('This channel is not public.  To embed charts, the channel must be public or a read key must be specified.');
      console.log('Thingspeak Data Loading Error');
    }
    for (var fieldIndex = 0; fieldIndex < fieldList.length; fieldIndex++) {
      for (var h = 0; h < data.feeds.length; h++) {
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
    channel.fieldList = fieldList;
    dynamicChart.redraw()
  });
}
