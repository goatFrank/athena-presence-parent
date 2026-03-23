package com.athena.auth.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean(destroyMethod = "shutdown")
    public RedisClient redisClient(
            @Value("${spring.data.redis.host:localhost}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort,
            @Value("${spring.data.redis.password:}") String redisPassword) {
            
        io.lettuce.core.RedisURI.Builder builder = io.lettuce.core.RedisURI.builder()
                .withHost(redisHost)
                .withPort(redisPort)
                .withTimeout(Duration.ofSeconds(10));
                
        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            builder.withPassword(redisPassword.toCharArray());
        }
        
        return RedisClient.create(builder.build());
    }

    @Bean
    public ProxyManager<byte[]> lettuceProxyManager(RedisClient redisClient) {
        StatefulRedisConnection<byte[], byte[]> connection = redisClient.connect(
                RedisCodec.of(ByteArrayCodec.INSTANCE, ByteArrayCodec.INSTANCE));
        
        return LettuceBasedProxyManager.builderFor(connection.async())
                .withExpirationStrategy(ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofSeconds(10)))
                .build();
    }
}
