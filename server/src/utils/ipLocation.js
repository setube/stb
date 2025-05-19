import * as Searcher from 'ip2region-ts'

// 指定ip2region数据文件路径
const dbPath = './src/utils/ip2region.xdb'

export const getIpLocation = async (ip) => {
  try {
    // 同步读取vectorIndex
    const vectorIndex = Searcher.loadVectorIndexFromFile(dbPath)
    // 查询IP信息
    const searcher = Searcher.newWithVectorIndex(dbPath, vectorIndex)
    const result = await searcher.search(ip)

    if (!result || !result.region) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        province: 'Unknown',
        isp: 'Unknown'
      }
    }
    // 解析返回的字符串，格式：国家|区域|省份|城市|ISP
    const [country, region, province, city, isp] = result.region.split('|')
    return {
      country: country === '0' ? 'Unknown' : country,
      region: region === '0' ? 'Unknown' : region,
      province: province === '0' ? 'Unknown' : province,
      city: city === '0' ? 'Unknown' : city,
      isp: isp === '0' ? 'Unknown' : isp
    }
  } catch (error) {
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      province: 'Unknown',
      isp: 'Unknown'
    }
  }
}