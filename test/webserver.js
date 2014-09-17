
var support = require('../support/webserver'),
	should = require('should'),
	http = require('http');

describe('Webserver, for test support',function(){

	before(function(done){
		var self = this;
		support.createServer(
				'test/webres.txt',
				function(server){
					self.supWebServer = server;
					done();
				}
		);
	});
	
	after(function(){
		this.supWebServer.close();
	});
	
	describe('GET server status',function(done){
		it('should return 200 http status',function(done){		
			http.get("http://127.0.0.1:" + this.supWebServer.port + "/download-all", function(res) {
			  (res.statusCode).should.equal(200);
			  done();
			});
		});
	});
	
});