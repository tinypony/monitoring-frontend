var kafka = require('kafka-node');

module.exports = function(zookeeperStr, cb) {
  var client = new kafka.Client(zookeeperStr, 'monitoring-frontend11234');


  var kafkaConsumer = new kafka.HighLevelConsumer(client, [
    {
      topic: 'metrics'
    }
  ], {
  	groupId: 'monitoring-frontend',
  	fromBeginning: false,
    // Auto commit config
    autoCommit: true,
    autoCommitIntervalMs: 5000
  });

  cb(kafkaConsumer);
};