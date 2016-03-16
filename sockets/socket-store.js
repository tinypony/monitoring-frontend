var _ = require('underscore');
var SocketStore = function() {
  this.entries = [];
};

SocketStore.prototype.addSocket = function(ws) {
  this.entries.push({
  	ws: ws,
    subscriptions: [
      { 
      	name: 'cpu.idle_perc', 
      	dimensions: {
          hostname: 'tinypony-VirtualBox'
        }
      }
    ]
  })
};

SocketStore.prototype.removeSocket = function(ws) {
  this.entries = _.reject(this.entries, function(entry) {
    return entry.ws === ws;
  });
}

SocketStore.prototype.getEntryForSocket = function(ws) {
  return _.findWhere(this.entries, {ws: ws});
};

SocketStore.prototype.setSubscriptions = function(ws, subs) {
  var entry = this.getEntryForSocket(ws);
  entry.subscriptions = subs;
};

SocketStore.prototype.matchesSubscription = function(subscription, msg) {
  var payload = JSON.parse(msg.value);
  
  if(_.isUndefined(payload.metric)) {
  	return false;
  }

  return subscription === '*' || 
          payload.metric.name === subscription.name && _.isMatch(payload.metric.dimensions, subscription.dimensions);
};

SocketStore.prototype.subscribed = function(entry, msg) {
  var self = this;
  return _.chain(entry.subscriptions)
		    .map(function(sub) {
		      return self.matchesSubscription(sub, msg);
		    })
		    .some()
		    .value();
};

SocketStore.prototype.pushMessage = function(msg) {
  var self = this;
  _.each(this.entries, function(entry) {
    if(self.subscribed(entry, msg)) {
      var payload = JSON.parse(msg.value);
      entry.ws.send(payload.metric.timestamp + ':' + payload.metric.value + ', partition:'+msg.partition);
    }
  });
};

module.exports = SocketStore;