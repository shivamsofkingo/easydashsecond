const Redis = require("ioredis");

class RedisClient {
    constructor(host, port, password) {
        this.client = new Redis({
            host: host,
            port: port,
            password: password,
            maxRetriesPerRequest: null,
        });

        this.client.on("connect", () => {
            console.log("Connected to Redis server.");
        });

        this.client.on("error", (err) => {
            console.error("Error connecting to Redis:", err);
        });
    }

    getClient() {
        return this.client;
    }

    close() {
        this.client.quit();
        console.log("Redis connection closed.");
    }
}

const redisHost = "13.200.84.6"  // 3.7.8.150 // 13.200.84.6
const redisPort = "6379";
const redisPassword = "ezydashSoftkingo"; // ezydashRedis // ezydashSoftkingo 

/* const redisHost = "redis-11645.crce217.ap-south-1-1.ec2.cloud.redislabs.com"  
const redisPort = "11645";
const redisPassword = "ZxVUAvAc1z1ZilrKICaxzFXKMwRZvCws";  */
module.exports = new RedisClient(redisHost, redisPort, redisPassword);