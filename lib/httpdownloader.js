
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url'),
	crypto = require('crypto');

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	this.suspend = false;
	
	this.start = function(){
		this.req.end();
	};
	
	this.onDataHandler = function(data){
		if ( this.config.decipher ) {
			var dataB64 = this.decipher.update(data);
			data = new Buffer(dataB64,'base64');
		}
	
		this.emit('data',data);
	};
	
	this.onFinishHandler = function(){
		var data = null;
		if ( this.config.decipher ) {
			var dataB64 = this.decipher.final();
			data = new Buffer(dataB64,'base64');
		}
	
		this.emit('end',data);
	};
	
	this.init = function(){
		var $this = this;
		
		if ( this.config.decipher ) {
			this.decipher = crypto.createDecipher(this.config.decipher.algorithm,this.config.decipher.secretkey);
		}
		
		this.req = http.request(this.config.reqOpt,function(res){
			res.on('data',function(data){ $this.onDataHandler(data); });
			res.on('end',function(){$this.onFinishHandler();});
		});
		
		this.req.on('error',function(error){
			console.log('ERRORE: ',error);
		});
	};
	
	this.init();
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader
