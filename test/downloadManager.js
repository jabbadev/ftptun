
var should = require('should'),
	DownloadManager = require('../lib/downloadManager.js'),
	support = require('../support/webserver'),
	fs = require('fs'),
	crypto = require('crypto');

describe('DownloadManager',function(){
	
	before(function(done){
		var self = this;
		support.createServer(
				'test/dm-resweb.txt',
				function(server){
					self.supWebServer = server;
					done();
				}
		);
	});
	
	after(function(){
		this.supWebServer.close();
	});
	
	describe('DownloadManager',function(){
		
		it('direct download',function(done){
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					url: 'http://127.0.0.1:' + this.supWebServer.port + "/download-all" ,
					disableProxy : true,
					disableChunk: true
			});
			
			dm.on('data',function(data,resInfo){
				data.length.should.eql(10240);
			});
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
		});
		
		it('chunk download',function(done){
			var dm = new DownloadManager({
				workers: 3,
				chunkSize: 1024,
				url: 'http://127.0.0.1:' + this.supWebServer.port + "/chunk" ,
				disableProxy : true
			});
		
			dm.on('data',function(data,resInfo){
				if(resInfo.chunkInfo.cn == 0 ){
					data.toString().should.eql((new Array(1025)).join('a'));
				}
				if(resInfo.chunkInfo.cn == 1 ){
					data.toString().should.eql((new Array(1025)).join('b'));
				}
			});
			dm.on('finish',function(){
				done();
			});
			dm.start();
		});
		
		it('deferred download',function(done){
			
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					url: 'http://127.0.0.1:' + this.supWebServer.port + '/chunk-deferred',
					disableProxy : true
			});
			
			dm.on('chunk',function(data,resInfo){
				// the client get first chunk 1 then chunk 0
				//   the chunk 0 is the last 
				if(resInfo.chunkInfo.cn == 0 ){
					data.toString().should.eql((new Array(1025)).join('a'));
					dm.status().totByte.should.eql(10240);
				}
				if(resInfo.chunkInfo.cn == 1 ){
					data.toString().should.eql((new Array(1025)).join('b'));
					dm.status().totByte.should.eql(1024);
				}
			});
			
			dm.on('data',function(data,resInfo){
				if(resInfo.chunkInfo.cn == 0 ){
					dm.status().totByte.should.eql(10240);
				}
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
			
		});
		
		it('auto direct download',function(done){
			var cont = 0;
			var dm = new DownloadManager({
				workers: 3,
				chunkSize: 1024,
				url: 'http://127.0.0.1:' + this.supWebServer.port + "/undefined-size",
				disableProxy : true
			});
			
			dm.on('data',function(data,resInfo){
				status = dm.status();
				(typeof status.resSize == "undefined").should.be.ok;
				if ( cont == 0 )	data.toString().should.eql('chunk 0');
				if ( cont == 1 )	data.toString().should.eql('chunk 1');
				cont++;
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
		});
		
		it('direct download error',function(done){
			var self = this, dm = new DownloadManager({
				workers: 3,
				chunkSize: 1024,
				url: 'http://127.0.0.1:' + this.supWebServer.port + "/error",
				disableProxy : true,
				disableChunk: true
			});
			
			dm.on('error',function(error,response,resInfo){
				resInfo.url.should.eql('http://127.0.0.1:' + self.supWebServer.port + "/error");
				response.statusCode.should.eql(500);
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
		});
		
		it('chunk download error',function(done){
			var dm = new DownloadManager({
				workers: 3,
				chunkSize: 1024,
				url: 'http://127.0.0.1:' + this.supWebServer.port + "/error-chunk" ,
				disableProxy : true
			});
		
			dm.on('error',function(error,response,resInfo){
				resInfo.chunkInfo.should.eql({ start: 3072, end: 4095 });
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
		});

	});
});