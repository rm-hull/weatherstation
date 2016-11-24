#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# The MIT License (MIT)
#
# Copyright (c) 2016 Richard Hull
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

import asyncio
import smbus2

import bme280


def stdout_logger(data):
    print(data)


class data_collector(object):

    def __init__(self, bus=None, port=1, address=0x76, interval=60, callback=stdout_logger):
        self._bus = bus or smbus2.SMBus(port)
        self._address = address
        self._interval = interval
        self._callback = callback

        try:
            bme280.load_calibration_params(bus, address)
        except:
            pass

    @asyncio.coroutine
    def start(self):
        self._shutdown = False
        while not self._shutdown:
            data = bme280.sample(self._bus, self._address)
            self._callback(data)
            yield asyncio.sleep(self._interval)

    def shutdown(self):
        self._shutdown = True
