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

import requests
import sqlite3
import time


class local_db(object):

    def __init__(self, filename):
        self._filename = filename
        self._create_table()
        self._create_indexes()

    def _create_table(self):
        with sqlite3.connect(self._filename) as conn:
            cur = conn.cursor()
            cur.execute("CREATE TABLE IF NOT EXISTS samples ( \
                         id TEXT PRIMARY KEY, \
                         timestamp INTEGER, \
                         temperature REAL, \
                         pressure REAL, \
                         humidity REAL)")
            conn.commit()

    def _create_indexes(self):
        with sqlite3.connect(self._filename) as conn:
            cur = conn.cursor()
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS \
                         idx_timestamp ON samples (timestamp)")
            conn.commit()

    def persist(self, data):
        fields = [str(data.id), time.mktime(data.timestamp.timetuple()),
                  data.temperature, data.pressure, data.humidity]

        with sqlite3.connect(self._filename) as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO samples VALUES (?,?,?,?,?)", fields)
            conn.commit()


class thing_speak(object):

    def __init__(self, api_key):
        self._api_key = api_key

    def persist(self, data):
        payload = {
            "api_key": self._api_key,
            "field1": data.temperature,
            "field2": data.humidity,
            "field3": data.pressure
        }
        requests.post("https://api.thingspeak.com/update", payload)
