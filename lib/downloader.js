
var URL = require('url'),
	http = require('http');

var Downloader = function( conf, url ) {
	this.conf = conf;
	this.resURL = url;
	this.reqURL = URL.parse(url);
	this.reqOpt = this.reqURL;
	
	this.setUpRequest = function() {
		this.reqOpt.headers = {};
		if ( this.conf['user-agent'] ) {
			this.reqOpt.headers['User-Agent'] = this.conf['user-agent'];
		}
		if ( this.conf['proxy-host'] ) {
			this.reqOpt.host = this.conf['proxy-host'];
			this.reqOpt.port = this.conf['proxy-port'];
			this.reqOpt.hostname = this.conf['proxy-host'];
			this.reqOpt.path = this.resURL;
			this.reqOpt.headers.Host = this.reqURL.hostname;
			this.reqOpt.method = "GET";
			
			if ( this.conf['proxy-auth'] == "Basic" ){
				this.reqOpt.headers['Proxy-Authorization'] = 
					this.conf['proxy-auth'] + " " + 
					new Buffer(this.conf['proxy-user']+ ":" + this.conf['proxy-passwd']).toString('base64');
			}
		}
	}
	
	this.getWebResSize = function(onResSize,onResMoved){
		var req, $this = this;
		this.reqOpt.method = 'HEAD';
		console.log('request to',this.reqOpt);
		req = http.request(this.reqOpt,function(res){
			console.log(res.statusCode);
			if ( res.statusCode == 301 ) {
				onResMoved.call($this,res.headers.location);
			}
			else {
				console.log(res.headers);
			}
		});
		req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});
		req.end();
	}
	
	this.startDownload = function(resSize){
		console.log('RES SIZE %i',resSize);
	}
	
	this.onResMoved = function(newURL){
		this.reqURL = URL.parse(newURL);
		this.reqOpt = this.reqOpt
		
		console.log(newURL);
		
		this.setUpRequest();
		this.getWebResSize(this.startDownload,this.onResMoved);
	}
	
	this.setUpRequest();
	this.getWebResSize(this.startDownload,this.onResMoved);
};

module.exports = Downloader;