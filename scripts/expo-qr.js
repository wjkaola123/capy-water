import QRCode from 'qrcode';
import { networkInterfaces } from 'node:os';
import { mkdir } from 'node:fs/promises';

const candidates = Object.entries(networkInterfaces())
  .filter(([name]) => !/virtual|vethernet|wsl|loopback/i.test(name))
  .flatMap(([, addresses]) => addresses)
  .filter(a => a.family === 'IPv4' && !a.internal);
const host = process.argv[2] || candidates[0]?.address;
if (!host) throw new Error('未找到局域网 IPv4 地址。请运行 npm run qr -- <电脑IP>');
const url = `exp://${host}:8081`;
await mkdir('test-results', { recursive: true });
await QRCode.toFile('test-results/expo-go.png', url, { width: 280, margin: 3, errorCorrectionLevel: 'M' });
console.log(`Expo Go: ${url}\n二维码已保存：test-results/expo-go.png\n请确认 npm start 已运行，且手机与电脑连接同一 Wi-Fi。`);
