/**
 * 阿里云 IoT 服务端订阅 · AMQP 1.0 消费
 *
 * 文档:https://help.aliyun.com/zh/iot/user-guide/amqp-server-side-subscription
 *
 * 关键点:
 * - 协议:AMQP 1.0(用 rhea 不是 amqplib;amqplib 是 0.9.1)
 * - host:${IotInstanceId}.amqp.iothub.aliyuncs.com:5671(TLS)
 * - clientId:`${ClientId}|authMode=aksign,signMethod=hmacsha1,timestamp=...,authId=${AccessKeyId},iotInstanceId=${IotInstanceId},consumerGroupId=${ConsumerGroupId}|`
 *   ⚠️ 旧文档可能少 iotInstanceId 字段;公共实例 + 新版控制台必须带
 * - username:`${ClientId}|authMode=aksign,signMethod=hmacsha1,timestamp=...,authId=${AccessKeyId},iotInstanceId=${IotInstanceId},consumerGroupId=${ConsumerGroupId}|`
 *   实际 SDK 的实现是 username 拼这串,clientId 是裸的(不同 SDK 写法不一)
 *   rhea 走 SASL PLAIN,把同样字符串塞进 username,password = HMAC-SHA1(AccessKeySecret, username 中要签名的部分)
 * - 收到消息后通过 application_properties.topic 判断,只关心 thing/event/property/post
 */
import * as crypto from 'crypto';
import rhea from 'rhea';
import type { EventContext } from 'rhea';
import { config } from '../config';
import { upsertFromPropertyPost } from '../db/repo';
import { AliyunPropertyPostBody } from '../types';

export interface AmqpStatus {
  connected: boolean;
  lastError?: string;
  receivedCount: number;
  lastMessageAt?: number;
}

const status: AmqpStatus = {
  connected: false,
  receivedCount: 0,
};

export function getAmqpStatus(): AmqpStatus {
  return { ...status };
}

// 把 timestamp 提到外面,username 和 password 共用一份
function buildSaslCreds(): { username: string; password: string; timestamp: number } {
  const timestamp = Date.now();
  // username 按官方文档格式拼,字段顺序参照 Aliyun Node.js demo
  const username =
    `${config.amqp.clientId}|authMode=aksign` +
    `,signMethod=hmacsha1` +
    `,timestamp=${timestamp}` +
    `,authId=${config.amqp.accessKeyId}` +
    `,iotInstanceId=${config.iotInstanceId}` +
    `,consumerGroupId=${config.amqp.consumerGroupId}|`;

  // 关键:signContent 是固定格式 "authId=${ak}&timestamp=${ts}",不是 username 截一段
  const signContent = `authId=${config.amqp.accessKeyId}&timestamp=${timestamp}`;
  const password = crypto
    .createHmac('sha1', config.amqp.accessKeySecret)
    .update(signContent)
    .digest('base64');

  return { username, password, timestamp };
}

export function startAmqpConsumer(): void {
  const host = `${config.iotInstanceId}.amqp.iothub.aliyuncs.com`;
  const port = 5671;

  const { username, password } = buildSaslCreds();

  console.log(`[AMQP] connecting to ${host}:${port}`);
  console.log(`[AMQP] consumerGroup=${config.amqp.consumerGroupId} clientId=${config.amqp.clientId}`);

  const container = rhea.create_container({ id: config.amqp.clientId });

  container.on('connection_open', () => {
    status.connected = true;
    status.lastError = undefined;
    console.log('[AMQP] connected');
  });

  container.on('connection_close', () => {
    status.connected = false;
    console.warn('[AMQP] connection closed');
  });

  container.on('disconnected', (ctx: EventContext) => {
    status.connected = false;
    const err = (ctx as any).error || (ctx.connection as any)?.error;
    if (err) {
      status.lastError = String(err.description || err.message || err);
      console.warn(`[AMQP] disconnected: ${status.lastError}`);
    } else {
      console.warn('[AMQP] disconnected (no error)');
    }
    // rhea 默认会自己重连(reconnect:true)
  });

  container.on('connection_error', (ctx: EventContext) => {
    const err = (ctx.connection as any)?.error;
    status.lastError = err ? String(err.description || err) : 'unknown';
    console.error(`[AMQP] connection_error: ${status.lastError}`);
  });

  container.on('message', (ctx: EventContext) => {
    const msg = ctx.message;
    if (!msg) return;
    status.receivedCount++;
    status.lastMessageAt = Date.now();

    const appProps = (msg.application_properties || {}) as Record<string, unknown>;
    const topic = String(appProps.topic ?? '');

    // 只处理属性上报;其他暂时只打日志
    if (!topic.includes('/thing/event/property/post')) {
      console.log(`[AMQP] skip topic=${topic}`);
      return;
    }

    let bodyStr: string;
    const rawBody = msg.body;
    if (typeof rawBody === 'string') {
      bodyStr = rawBody;
    } else if (rawBody && typeof rawBody === 'object' && 'content' in (rawBody as any)) {
      // rhea 经常把 data section 包成 {typecode, content: Buffer}
      const content = (rawBody as any).content;
      bodyStr = Buffer.isBuffer(content) ? content.toString('utf-8') : String(content);
    } else if (Buffer.isBuffer(rawBody)) {
      bodyStr = rawBody.toString('utf-8');
    } else {
      bodyStr = JSON.stringify(rawBody);
    }

    let parsed: AliyunPropertyPostBody;
    try {
      parsed = JSON.parse(bodyStr);
    } catch (e) {
      console.warn(`[AMQP] non-JSON body topic=${topic}: ${bodyStr.slice(0, 120)}`);
      return;
    }

    if (!parsed.deviceName || !parsed.productKey || !parsed.items) {
      console.warn(`[AMQP] envelope missing fields topic=${topic}`);
      return;
    }

    const t = upsertFromPropertyPost(parsed);
    console.log(
      `[AMQP] ↑ ${t.deviceName} ` +
        `temp=${t.temp ?? '-'} humi=${t.humi ?? '-'} pm25=${t.PM25 ?? '-'} ` +
        `wind=${t.wind ?? '-'} led=${t.led ?? '-'} pwq=${t.pwq ?? '-'} csb=${t.csb ?? '-'}`
    );
  });

  const conn = container.connect({
    host,
    port,
    transport: 'tls',
    // SNI:阿里云 AMQP 必须给 servername 才能命中正确证书
    servername: host,
    // Windows 上 Node 的 bundled CA 经常验不过阿里云链,默认放过(毕设演示场景)
    // 生产环境应该走 NODE_EXTRA_CA_CERTS 指向阿里云 CA bundle
    rejectUnauthorized: process.env.AMQP_TLS_STRICT === '1',
    reconnect: true,
    initial_reconnect_delay: 1000,
    max_reconnect_delay: 30000,
    sasl_mechanisms: ['PLAIN'] as any,
    username,
    password,
    container_id: config.amqp.clientId,
  } as any);

  // 创建 receiver(source 是 "consumer group" 名称下默认队列,阿里云用 source 默认即可)
  conn.open_receiver({
    source: { address: config.amqp.consumerGroupId },
    autoaccept: true,
  });
}
