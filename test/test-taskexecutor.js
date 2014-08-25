
var TaskExecutor = require('../lib/taskexecutor'),
	should = require('should');

describe('TaskExecutor',function(){
	
	describe('#TaskExecutor.staus()',function(){
		it("should return the TaskExecutor status",function(){
			var te = new TaskExecutor([function(){},function(){},function(){},function(){},function(){}]);
			({ tasks: 5, running: 0 }).should.eql(te.status());
		});
	});
	
	describe('#TaskExecutor.start()',function(){
		it("should return the TaskExecutor status",function(done){
			
			var ok_task = [],
			ko_task = [],
			te = new TaskExecutor([
     	      function(callback){
     			   setTimeout(function(){callback({ stat: "ok", id: 1 },null);},100);
     		  },
     		  function(callback){
     			   setTimeout(function(){callback(null,{ id: 2, code: 500, message: "resource unavailable" });},5);
     		  },
     		  function(callback){
     			   setTimeout(function(){callback({ id: 3 },null);},3);
     		  }
			],2);
			
			te.on('taskComplete',function(success,error){
				if(!error){
					ok_task.push(success.id);
				}
				else {
					ko_task.push(error);
				}
			});
			te.on('allTasksComplete',function(){
				[3,1].should.eql(ok_task);
				({ id: 2, code: 500, message: "resource unavailable" }).should.eql(ko_task[0]);
				done();
			});
			
			te.start();
			({ tasks: 3, running: 2 }).should.eql(te.status());
			
		});
	
		describe('#TaskExecutor.start() on empty task list',function(){
			it("should return the TaskExecutor status",function(done){
				var te = new TaskExecutor([],3);
				te.on('allTasksComplete',function(){done();});
				te.start();
			});
		});
		
		describe('#TaskExecutor.start() on 3 task list with pool 1',function(){
			it("should return the TaskExecutor status",function(done){
				var ok_tasks = [];
				var te = new TaskExecutor([function(callback){callback(1,null);},
				                           function(callback){callback(2,null);},
				                           function(callback){callback(3,null);},
				                           function(callback){callback(4,null);}
				                           ],1);
				te.on('taskComplete',function(success,error){ok_tasks.push(success); });
				te.on('allTasksComplete',function(){
					[1,2,3,4].should.eql(ok_tasks);
					done();
				});
				te.start();
			});
		});
		
		describe('#TaskExecutor.start() in supply mode',function(){
			it("TaskExecutor supply mode",function(done){
				var cont = -1, ok_tasks = [];
				
				var tasks = [
		             function(callback){
						setTimeout(function(){callback(1,null);},100);
					 },
		             function(callback){
						setTimeout(function(){callback(2,null);},105);
					 },
		             function(callback){
		            	setTimeout(function(){callback(3,null);},10);
		             },
		             function(callback){
		            	setTimeout(function(){callback(4,null);},1);
		             }
				];
				
				var te = new TaskExecutor(function(){
					if( cont == tasks.length - 1){
						return null;
					}
					cont++;
					return tasks[cont];
				},3);
				
				te.on('taskComplete',function(success,error){
					ok_tasks.push(success);
				});
				
				te.on('allTasksComplete',function(){
					[3,4,1,2].should.eql(ok_tasks);
					done();
				});
				
				te.start();
				
				
			});
		});
		
		
		describe('#TaskExecutor.start() in supply mode',function(){
			it("TaskExecutor with supplier that return something different from function",function(done){
				var cont = -1, ok_tasks = [];
				
				var tasks = [
		             function(callback){
						setTimeout(function(){callback(1,null);},50);
					 },
		             function(callback){
						setTimeout(function(){callback(2,null);},5);
					 },
		             function(callback){
		            	setTimeout(function(){callback(3,null);},100);
		             },
		             function(callback){
		            	setTimeout(function(){callback(4,null);},10);
		             }
				];
				
				var te = new TaskExecutor(function(){
					if( cont == tasks.length - 1){
						return "no more tasks";
					}
					cont++;
					return tasks[cont];
				},2);
				
				te.on('taskComplete',function(success,error){
					ok_tasks.push(success);
				});
				
				te.on('allTasksComplete',function(){
					[2,1,4,3].should.eql(ok_tasks);
					done();
				});
				
				te.start();
				
				
			});
		});
		
	});
	
	
	
});