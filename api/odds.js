const axios = require('axios');

// 从环境变量获取 API Key（安全）
const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

// 获取今日比赛列表
async function getTodayFixtures() {
  const today = new Date().toISOString().split('T')[0];
  const url = `${BASE_URL}/fixtures?date=${today}`;
  const response = await axios.get(url, {
    headers: { 'x-rapidapi-key': API_KEY }
  });
  return response.data.response.map(f => ({
    id: f.fixture.id,
    home: f.teams.home.name,
    away: f.teams.away.name,
    league: f.league.name,
    time: f.fixture.date
  }));
}

// 获取赔率（欧赔、亚盘、大小球）
async function getOdds(fixtureId) {
  const url = `${BASE_URL}/odds?fixture=${fixtureId}`;
  const response = await axios.get(url, {
    headers: { 'x-rapidapi-key': API_KEY }
  });
  
  const bookmaker = response.data.response[0]?.bookmakers[0];
  if (!bookmaker) return null;
  
  const bets = bookmaker.bets;
  const findVal = (name) => {
    const bet = bets.find(b => b.name === name);
    return bet?.values[0]?.value || null;
  };
  
  // 提取数据（这里只做简单映射，具体字段名可根据实际API返回调整）
  const eu = findVal('Match Winner');
  const asian = findVal('Asian Handicap');
  const ou = findVal('Over/Under');
  
  // 返回一个和之前模拟数据结构一致的对象
  return {
    euWinInit: eu || '2.00',
    euDrawInit: eu || '3.40',
    euLoseInit: eu || '3.80',
    euWinNow: eu || '2.00',
    euDrawNow: eu || '3.40',
    euLoseNow: eu || '3.80',
    asiaHandicapInit: '0.5',
    asiaWaterInit: '0.90',
    asiaHandicapNow: '0.5',
    asiaWaterNow: '0.90',
    ouHandicapInit: '2.5',
    ouWaterInit: '0.88',
    ouHandicapNow: '2.5',
    ouWaterNow: '0.92',
    homeGoals: '',
    homeConceded: '',
    awayGoals: '',
    awayConceded: '',
    h2hHomeGoals: '',
    h2hAwayGoals: '',
    note: `${fixtureId}`
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { fixtureId } = req.query;
  
  try {
    if (!fixtureId) {
      const fixtures = await getTodayFixtures();
      return res.json(fixtures);
    }
    const odds = await getOdds(fixtureId);
    res.json(odds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
