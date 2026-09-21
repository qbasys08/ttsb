import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // 진입점 파일 경로 (본인의 메인 파일에 맞게 수정)
  splitting: false,
  clean: true,             // 빌드 전에 dist 폴더를 깔끔하게 비움
  format: ['esm'],         // Node.js 환경에 맞게 CommonJS로 번들 (ESM을 쓰시면 'esm'으로 변경)
  minify: true,            // 코드를 압축하여 용량을 줄이고 깔끔하게 만듦
  sourcemap: true,         // 에러 추적을 위한 소스맵 생성
  external: ['discord.js'], // 외부 의존성은 번들에서 제외 (node_modules를 참조하도록 설정)
});