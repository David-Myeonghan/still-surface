// 공유 카드에 그릴 텍스트 구성(순수, 비의존). stats: {time,motes,seed,mode,best,isBest}.
export function cardLines(stats) {
  const daily = stats.mode === 'daily';
  return {
    title: '고요한 표면 · Still Surface',
    time: stats.time,
    sub: `✦ ${stats.motes}   ·   행성 #${stats.seed}${daily ? ' · 오늘' : ''}`,
    best: stats.isBest ? '새 기록!' : (stats.best ? `최고 ${stats.best}` : ''),
    foot: 'david-myeonghan.github.io/still-surface',
  };
}
