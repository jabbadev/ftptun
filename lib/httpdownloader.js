
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url');

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	this.suspend = false;
	
	this.start = function(){
		this.req.end();
	};
	
	this.onDataHandler = function(data){
		console.log('data: ',data.length);
	}
	
	this.init = function(){
		var $this = this;
		this.req = http.request(this.config.reqOpt,function(res){
			res.on('data',$this.onDataHandler);
		});
		
		this.req.on('error',function(error){
			console.log(error);
		});
	};
	
	this.init();
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader
