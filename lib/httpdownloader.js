
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url'),
	crypto = require('crypto');
	request = require('request');
	PassThrough = require('stream').PassThrough;

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
		ptunReqBody = null,
		decipher = null,
		reqOpt = {},
		headReqOpt = null,
		size = null,
		stream = null;
		sizeSream = null,
		url = null;
	
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
	
		self.emit('end',data,{url: url, size: size});
	};
	
	function init(){
		var chunkPrefix = "";
		
		stream = new PassThrough();
		stream.on('data',function(data){ onDataHandler(data); });
		stream.on('end',function(){onFinishHandler();});
		
		reqOpt.url = URL.parse(config.url);
		if( typeof config.disableProxy !== "undefined" ){
			reqOpt.proxy = !config.disableProxy;
		}
		
		if ( config.ptun ) {
			decipher = crypto.createDecipher(config.ptun.algorithm,config.ptun.secretkey);
			chunkPrefix = "x-";
			
			ptunReqBody = {};
			ptunReqBody.method = 'GET';
			ptunReqBody.hostname = reqOpt.url.hostname;
			ptunReqBody.port = reqOpt.url.port;
			ptunReqBody.path = reqOpt.url.path;
			
			var serURL = URL.parse(config.ptun.server);
			
			reqOpt.method = 'POST';
			reqOpt.url.hostname = serURL.hostname;
			reqOpt.url.port = serURL.port;
			reqOpt.url.path = serURL.path;
			reqOpt.json = ptunReqBody;
		}

		if ( config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			reqOpt.headers = {};
			reqOpt.headers[range] = config.chunk.start + "-" + config.chunk.end;
			reqOpt.headers[cache] = "no-store";
		}
	};
	
	init();
	
	this.start = function(){
		reqOpt.url = config.url;
		request(reqOpt,function(error, response, body){
			if (!error && response.statusCode == 200) {
				url = response.request.uri.href;
				size = response.headers['content-length'];
			}
		}).pipe(stream);
	};
	
	function onResSize(callback,resInfo){
		size = resInfo.size;
		url = resInfo.url;
		callback(resInfo,null);
	};
	
	this.size = function(callback){
		headReqOpt = reqOpt;
		headReqOpt.method = 'HEAD';
		request(headReqOpt,function(error,response){
			if (!error && response.statusCode == 200) {
				url = response.request.uri.href;
				onResSize(callback,{
					url: response.request.uri.href,
					size: response.headers['content-length']});
			}
		});
	};
	
	this.url = function(){
		return url;
	};
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader;
