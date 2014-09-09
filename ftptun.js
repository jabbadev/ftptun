#!/bin/env node

var Config = require('./lib/clientInit.js'),
	Downloader = require('./lib/downloader.js'),                      
	finish = false;

clientConf = new Config();
clientConf.loadConfig(Main);

function Main(conf){
	console.log(conf,process.argv[2]);
	//var downloader = new Downloader(conf,process.argv[2]);
};

