const Kafka = require('node-rdkafka')

class Producer {
  ERR_TOPIC_ALREADY_EXISTS = 36

  ensureTopicExists () {
    const adminClient = Kafka.AdminClient.create({
      'bootstrap.servers': 'kafka-kafka-1:9092'
    })
    return new Promise((resolve, reject) => {
      adminClient.createTopic({
        topic: 'topic-custom-event-3',
        num_partitions: 3,
        replication_factor: 1
      }, (err) => {
        if (!err) {
          console.log('Created topic')
          return resolve()
        }

        if (err.code === this.ERR_TOPIC_ALREADY_EXISTS) {
          console.log('Topic already exists')
          return resolve()
        }

        return reject(err)
      })
    })
  }

  async createProducer () {
    this.producer = new Kafka.Producer({
      'bootstrap.servers': 'kafka-kafka-1:9092',
      'request.required.acks': 'all',
      dr_cb: true, // delivery report
      'enable.idempotence': true // When set to true, the producer will ensure that messages are successfully produced exactly once and in the original produce order
    })
    return new Promise((resolve, reject) => {
      this.producer
        .on('ready', () => resolve(this.producer))
        .on('delivery-report', this.onDeliveryReport)
        .on('event.error', (err) => {
          console.warn('event.error', err)
          reject(err)
        })
      this.producer.setPollInterval(100)
      this.producer.connect()
    })
  }

  async publish (message) {
    await this.ensureTopicExists()
    await this.createProducer()

    this.producer.produce('topic-custom-event-3', 'key-action', Buffer.from(message))
    console.log(`Producing record ${message}`)
  }

  onDeliveryReport (err, report) {
    if (err) {
      console.warn('Error producing', err)
    } else {
      const { topic, partition, value } = report
      console.log(`Successfully produced record to topic "${topic}" partition ${partition} ${value}`)
    }
  }
}

const producer = new Producer()
producer.publish('{ "action": "OPEN_THE_DOOR" }')
