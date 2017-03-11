#!/usr/bin/env python

import os
from setuptools import setup

import ablargern

README = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()

setup(
    name="weatherstation",
    version=ablargern.__version__,
    author="Richard Hull",
    author_email="richard.hull@destructuring-bind.org",
    description="A weatherstation data logger",
    long_description=README,
    license="MIT",
    keywords=["raspberry pi", "orange pi", "banana pi", "rpi", "SSD1306", "BME280", "i2c", "temperature", "humidity", "pressure"],
    url="https://github.com/rm-hull/weatherstation",
    download_url="https://github.com/rm-hull/weatherstation/tarball/" + ablargern.__version__,
    packages=['ablargern'],
    install_requires=["smbus2", "RPi.bme280", "luma.oled", "OPi.GPIO"],
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Education",
        "Intended Audience :: Developers",
        "Topic :: Education",
        "Topic :: System :: Hardware",
        "Programming Language :: Python :: 2",
        "Programming Language :: Python :: 3"
    ]
)
