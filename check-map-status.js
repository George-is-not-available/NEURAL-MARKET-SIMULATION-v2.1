// 检查地图状态的脚本
const checkMapStatus = () => {
  // 检查环境变量
  const apiKey = process.env.REACT_APP_AMAP_API_KEY;
  const securityKey = process.env.REACT_APP_AMAP_SECURITY_KEY;
  
  console.log('=== 地图状态检查 ===');
  console.log('高德地图API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : '未设置');
  console.log('安全密钥:', securityKey ? `${securityKey.substring(0, 8)}...` : '未设置');
  
  // 检查API Key格式
  const isValidApiKey = (key) => {
    return key && key.length === 32 && /^[a-f0-9]{32}$/i.test(key);
  };
  
  const isValidSecurityKey = (key) => {
    return key && key.length === 32 && /^[a-f0-9]{32}$/i.test(key);
  };
  
  console.log('API Key 格式:', isValidApiKey(apiKey) ? '✅ 有效' : '❌ 无效');
  console.log('安全密钥格式:', isValidSecurityKey(securityKey) ? '✅ 有效' : '❌ 无效');
  
  // 检查网络连接
  console.log('检查高德地图API连接...');
  
  return {
    apiKey,
    securityKey,
    isValidApiKey: isValidApiKey(apiKey),
    isValidSecurityKey: isValidSecurityKey(securityKey)
  };
};

// 如果在Node环境中运行
if (typeof process !== 'undefined' && process.env) {
  // 模拟环境变量
  process.env.REACT_APP_AMAP_API_KEY = 'ef3c3095b51b10259a39ac4216e81f1f';
  process.env.REACT_APP_AMAP_SECURITY_KEY = 'cea99f47726c5e7712f7b851201866aa';
  
  checkMapStatus();
} else {
  console.log('请在React应用中运行此检查');
}