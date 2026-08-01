# 고요한 표면 · Still Surface

낯선 행성을 홀로 걸으며, 안개 너머 빛나는 공명체 일곱 개를 찾아 스캔하는 3D 탐험 게임.
Three.js + Vite + GLSL, 절차 생성 지형, WebAudio. 티스토리 블로그 임베드 / 포트폴리오용.

**플레이:** https://david-myeonghan.github.io/still-surface/

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm test         # 순수 로직 단위 테스트 (node:test)
npm run smoke    # E2E 스모크 (시스템 Chrome, 개발 서버 필요)
npm run build    # 프로덕션 빌드 → dist/
```

Node 20+ 필요.

## 조작

`W A S D` 이동(카메라 기준) · `Shift` 달리기 · 마우스로 3인칭 카메라 회전 · `F` 홀드로 스캔.
캐릭터가 이동 방향으로 몸을 돌리며 달린다.

## 티스토리 임베드

```html
<iframe
  src="https://david-myeonghan.github.io/still-surface/"
  width="100%" height="600"
  style="border:0;border-radius:12px;max-width:960px;"
  allow="pointer-lock; fullscreen"
  loading="lazy"
  title="고요한 표면 · Still Surface"></iframe>
<p style="text-align:center;margin-top:8px;">
  화면이 답답하면 <a href="https://david-myeonghan.github.io/still-surface/" target="_blank" rel="noopener">새 탭에서 전체화면으로 플레이 ↗</a>
</p>
```

`allow="pointer-lock; fullscreen"`가 없으면 시선 조작(마우스 잠금)이 iframe 안에서 막힌다.
포인터 잠금이 불편한 환경을 위해 새 탭 링크를 함께 둔다.

## 문서

- [design.md](docs/design.md) — 디자인/도파민 루프/기술 구조
- [roadmap.md](docs/roadmap.md) — 로버·채집·다중 행성·모바일 확장
