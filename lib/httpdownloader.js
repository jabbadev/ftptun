
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url');

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	this.suspend = false;
	
	this.work = function(){
	
	};
	
	this.suspend = function(){
	
	};
	
	this.init = function(){
		if (typeof(this.config.reqOpt) === "string" ){
			
		}
	};
	
	this.init();
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader
