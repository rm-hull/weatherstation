#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# The MIT License (MIT)
#
# Copyright (c) 2016-17 Richard Hull
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import smbus2
import bme280


def stdout_logger(loop, data):
    print(data)


class environment_sensor(object):

    def __init__(self, led=None, bus=None, port=1, address=0x76, interval=60, callback=stdout_logger):
        self._led = led
        self._bus = bus or smbus2.SMBus(port)
        self._address = address
        self._interval = interval
        self._callback = callback
        self._shutdown = False

        try:
            bme280.load_calibration_params(self._bus, self._address)
        except:  # noqa: E722
            pass

    def start(self, loop):
        if not self._shutdown:
            loop.call_soon(self._ticker, loop)

    def shutdown(self):
        self._shutdown = True

    def _ticker(self, loop):
        if not self._shutdown:
            if self._led:
                self._led.on()
                loop.call_later(1, self._led.off)

            data = bme280.sample(self._bus, self._address)
            self._callback(loop, data)
            loop.call_later(self._interval, self._ticker, loop)
