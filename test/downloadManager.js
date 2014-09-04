
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
	
	describe('#DownloadManager test',function(){
		it('test download manager',function(done){
			
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					resSize: 10240,
					url: 'http://127.0.0.1:' + this.supWebServer.port + '/chunk' 
			});
			
			dm.on('data',function(chunk){
				if(chunk.cn == 0 ){
					chunk.data.toString().should.eql((new Array(1025)).join('a'));
					dm.status().totByte.should.eql(1024);
				}
				if(chunk.cn == 2){
					chunk.data.toString().should.eql((new Array(1025)).join('c'));
					dm.status().totByte.should.eql(3072);
				}
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
			
		});
		
		it('download chunk feature disabled',function(done){
			var dm = new DownloadManager({
				url: 'http://127.0.0.1:' + this.supWebServer.port
			});
			
			dm.on('data',function(pseudoChunk){
				(pseudoChunk.data.length).should.eql(10240);
				dm.status().totByte.should.eql(10240);
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
		});
		
		it('download deferred chunk',function(done){
			
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					resSize: 10240,
					url: 'http://127.0.0.1:' + this.supWebServer.port + '/chunk-deferred' 
			});
			
			dm.on('chunk',function(chunk){
				if(chunk.cn == 0 ){
					chunk.data.toString().should.eql((new Array(1025)).join('a'));
					dm.status().totByte.should.eql(10240);
				}
				if(chunk.cn == 1 ){
					chunk.data.toString().should.eql((new Array(1025)).join('b'));
					dm.status().totByte.should.eql(1024);
				}
			});
			
			dm.on('data',function(chunk){
				if(chunk.cn == 0 ){
					dm.status().totByte.should.eql(10240);
				}
			});
			
			dm.on('finish',function(){
				done();
			});
			
			dm.start();
			
		});
	});

});