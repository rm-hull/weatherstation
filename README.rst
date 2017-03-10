BME280 Weatherstation
=====================
.. image:: https://travis-ci.org/rm-hull/weatherstation.svg?branch=master
   :target: https://travis-ci.org/rm-hull/weatherstation
   

This weatherstation is a comprised of a number of components:

* OrangePi Zero:

  * Armbian 5.24 (Jessie server)
  * H2+ ARM CPU - 4x cores
  * 256Mb RAM 
  * 2Gb SDHC card
  * WiFi, Ethernet
  * $6.99

* Small stripboard circuit comprising:
  
  * 26-pin IDC socket
  * SSD1306 128x64 pixel OLED display, I2C version
  * BME280 Environment sensor (temperature, pressure and humidity)
  * 3mm LED (pin 8 / UART1_TX / PG06)
  * Pushbutton (pin 10 / UART1_RX / PG07)
  
* Web monitoring / charting:

  * http://www.destructuring-bind.org/weatherstation/
  * Static HTML page, served out of Github
  * ThingSpeak / Highchart.js integration

* Python 3 async data-logger:

  * Uses https://github.com/rm-hull/bme280 for sampling every 30 seconds
  * Uses https://github.com/rm-hull/ssd1306 for local display
  * Persists readings to a local SQLite database
  * Uploads readings to a https://api.thinkspeak.com channel

.. image:: doc/bme280-weatherstation.jpg?raw=true
.. image:: doc/web-weatherstation.png?raw=true 

TODO
----
* SSD1306 screen display
* Toggle display on/off with pushbutton
* Flash LED when taking a reading
* Config options as command line args
  - specify port in config 
* Refactor JS
* Dewpoint estimate
* LUX sensor
* Full height chart in browser window

References
----------

* http://www.instructables.com/id/Raspberry-datalogger-with-Mysql-Highcharts/

License
-------

The MIT License (MIT)

Copyright (c) 2016 Richard Hull

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
