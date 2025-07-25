import express from 'express';
import axios from 'axios';

const router = express.Router();

// 高德地图安全密钥
const AMAP_SECURITY_KEY = process.env.AMAP_SECURITY_KEY || 'cea99f47726c5e7712f7b851201866aa';

// 自定义地图样式服务代理
router.use('/v4/map/styles', async (req, res) => {
  try {
    const originalUrl = req.originalUrl.replace('/_AMapService', '');
    const targetUrl = `https://webapi.amap.com${originalUrl}`;
    
    // 添加安全密钥到查询参数
    const separator = targetUrl.includes('?') ? '&' : '?';
    const urlWithSecurity = `${targetUrl}${separator}jscode=${AMAP_SECURITY_KEY}`;
    
    console.log('🗺️ 代理自定义地图服务:', urlWithSecurity);
    
    const response = await axios.get(urlWithSecurity, {
      headers: {
        'User-Agent': req.get('User-Agent'),
        'Referer': req.get('Referer'),
      },
    });
    
    res.set(response.headers);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('自定义地图服务代理错误:', error);
    res.status(500).json({ error: '代理服务器错误' });
  }
});

// Web服务API代理
router.use('/', async (req, res) => {
  try {
    const originalUrl = req.originalUrl.replace('/_AMapService', '');
    const targetUrl = `https://restapi.amap.com${originalUrl}`;
    
    // 添加安全密钥到查询参数
    const separator = targetUrl.includes('?') ? '&' : '?';
    const urlWithSecurity = `${targetUrl}${separator}jscode=${AMAP_SECURITY_KEY}`;
    
    console.log('🌐 代理Web服务API:', urlWithSecurity);
    
    const response = await axios({
      method: req.method,
      url: urlWithSecurity,
      data: req.body,
      headers: {
        'User-Agent': req.get('User-Agent'),
        'Referer': req.get('Referer'),
        'Content-Type': req.get('Content-Type'),
      },
    });
    
    res.set(response.headers);
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Web服务API代理错误:', error);
    res.status(500).json({ error: '代理服务器错误' });
  }
});

export default router;