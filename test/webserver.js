
var support = require('./support/webserver');

describe('support',function(){

	before(function(done){
		support.createServer(
				'test/a.txt',
				function(server){
					console.log('server started .....',server);
					done();
				}
		);
	});
	
	describe('#DownloadManager test',function(done){
		it('test download manager',function(done){
			console.log('fake ....');
		});
	});
	
});