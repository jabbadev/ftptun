
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url'),
	crypto = require('crypto');

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
		ptunReqBody = null,
		decipher = null,
		req = null,
		headReqOpt = null,
		size = null;
	
	function onDataHandler(data){
		if ( config.ptun ) {
			var dataB64 = decipher.update(data);
			data = new Buffer(dataB64,'base64');
		}
	
		self.emit('data',data);
	};
	
	function onFinishHandler(){
		var data = null;
		if ( config.ptun ) {
			var dataB64 = decipher.final();
			data = new Buffer(dataB64,'base64');
		}
	
		self.emit('end',data);
	};
	
	function init(){
		var chunkPrefix = "";
		
		config.reqOpt = URL.parse(config.url);
		
		if ( config.ptun ) {
			decipher = crypto.createDecipher(config.ptun.algorithm,config.ptun.secretkey);
			chunkPrefix = "x-";
			
			ptunReqBody = {};
			ptunReqBody.method = 'GET';
			ptunReqBody.hostname = config.reqOpt.hostname;
			ptunReqBody.port = config.reqOpt.port;
			ptunReqBody.path = config.reqOpt.path;
			
			var serURL = URL.parse(config.ptun.server);
			
			config.reqOpt.method = 'POST';
			config.reqOpt.hostname = serURL.hostname;
			config.reqOpt.port = serURL.port;
			config.reqOpt.path = serURL.path;
		}

		if ( config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			config.reqOpt.headers = {};
			config.reqOpt.headers[range] = config.chunk.start + "-" + config.chunk.end;
			config.reqOpt.headers[cache] = "no-store";
		}
		
		req = http.request(config.reqOpt,function(res){
			res.on('data',function(data){ onDataHandler(data); });
			res.on('end',function(){onFinishHandler();});
		});
		
		req.on('error',function(error){
			console.log('ERRORE: ',error);
		});
	};
	
	init();
	
	this.start = function(){
		if ( config.ptun ){
			req.write(JSON.stringify(ptunReqBody));
		}
		req.end();
	};
	
	function onResSize(callback,resSize){
		size = resSize;
		callback(resSize,null);
	};
	
	this.size = function(callback){
		headReqOpt = config.reqOpt;
		headReqOpt.method = 'HEAD';
		req = http.request(headReqOpt,function(res){
			if ( res.statusCode == 301 ) {
				console.log(res.headers);
				onResMoved.call($this,res.headers.location);
			}
			else {
				onResSize(callback,res.headers['content-length']);
			}
		});
		req.on('error', function(e) {
			callback(null,e);
		});
		req.end();
	};
	
	this.url = function(){
		
	};
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader;
