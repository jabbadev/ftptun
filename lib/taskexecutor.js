

var TaskExecutor = function(tasks,nrt){
	this.tasks = tasks;
	this.nrt = nrt;
	this.running = 0;
	this.cont = 0;
	
	this._taskend = function(success,error){
		console.log('taskcomplete succes');
	};
	
	this._getTask = function(self){
		return function(){ self.tasks[self.cont](self._taskend); };
	};
	
	this.start = function(){
		var self = this;
		while( self.running < self.nrt ){
			self._getTask(self)();
			self.cont++;
			self.running++;
		}
	};
	
	this.status = function(){
		return {tasks: this.tasks.length, running: this.running };
	};
};

module.exports = TaskExecutor;


