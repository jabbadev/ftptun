
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
		if ( this.config.ptun ) {
			var dataB64 = this.decipher.update(data);
			data = new Buffer(dataB64,'base64');
		}
	
		this.emit('data',data);
	};
	
	this.onFinishHandler = function(){
		var data = null;
		if ( this.config.ptun ) {
			var dataB64 = this.decipher.final();
			data = new Buffer(dataB64,'base64');
		}
	
		this.emit('end',data);
	};
	
	this.init = function(){
		var $this = this, chunkPrefix = "";
		
		if ( this.config.ptun ) {
			this.decipher = crypto.createDecipher(this.config.ptun.algorithm,this.config.ptun.secretkey);
			chunkPrefix = "x-";
		}

		if ( this.config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			this.config.reqOpt.headers = {};
			this.config.reqOpt.headers[range] = this.config.chunk.start + "-" + this.config.chunk.end;
			this.config.reqOpt.headers[cache] = "no-store";
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
