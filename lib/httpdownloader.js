
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url'),
	crypto = require('crypto');
	request = require('request');

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
		ptunReqBody = null,
		decipher = null,
		req = null,
		reqOpt = {},
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
		
		reqOpt = URL.parse(config.url);
		
		if ( config.ptun ) {
			decipher = crypto.createDecipher(config.ptun.algorithm,config.ptun.secretkey);
			chunkPrefix = "x-";
			
			ptunReqBody = {};
			ptunReqBody.method = 'GET';
			ptunReqBody.hostname = reqOpt.hostname;
			ptunReqBody.port = reqOpt.port;
			ptunReqBody.path = reqOpt.path;
			
			var serURL = URL.parse(config.ptun.server);
			
			reqOpt.method = 'POST';
			reqOpt.hostname = serURL.hostname;
			reqOpt.port = serURL.port;
			reqOpt.path = serURL.path;
			reqOpt.json = ptunReqBody;
		}

		if ( config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			reqOpt.headers = {};
			reqOpt.headers[range] = config.chunk.start + "-" + config.chunk.end;
			reqOpt.headers[cache] = "no-store";
		}
		/*
		request(config.reqOpt,function (error, response, data) {
			if (!error && response.statusCode == 200) {
				onDataHandler(data);
			 }
		});*/
		
		/*
		req = http.request(config.reqOpt,function(res){
			res.on('data',function(data){ onDataHandler(data); });
			res.on('end',function(){onFinishHandler();});
		});
		
		req.on('error',function(error){
			console.log('ERRORE: ',error);
		});*/
		
		
	};
	
	init();
	
	this.start = function(){
		/*
		if ( config.ptun ){
			req.write(JSON.stringify(ptunReqBody));
		}
		req.end();
		*/
		console.log(reqOpt);
		request(reqOpt,function (error, response, data) {
			if (!error && response.statusCode == 200) {
				onDataHandler(data);
			 }
		});
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
