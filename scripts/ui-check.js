#!/usr/bin/env node
/**
 * UI 검수 스크립트
 * 배포 전 레이아웃 검사
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = process.argv[2] || 'https://sejun-run.github.io/openclaw-game/game.html';
const VIEWPORT = { width: 844, height: 390 }; // 모바일 가로 (iPhone 14 Pro Max landscape)

async function checkUI() {
  console.log('🔍 UI 검수 시작...\n');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  
  const issues = [];
  
  try {
    // 1. 페이지 로드
    console.log(`📄 페이지 로드: ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // 2. 도감 탭 스크린샷
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    
    await page.screenshot({ path: path.join(screenshotDir, '01-dogam.png') });
    console.log('📸 도감 탭 스크린샷 저장');
    
    // 3. 게임 시작 (쉬움)
    console.log('🎮 게임 시작 (쉬움)...');
    await page.click('[onclick="startGame(\'easy\')"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: path.join(screenshotDir, '02-game-start.png') });
    console.log('📸 게임 화면 스크린샷 저장');
    
    // 4. 레이아웃 검사
    console.log('\n🔎 레이아웃 검사...');
    
    // 화면 밖으로 나간 요소 체크
    const outOfBounds = await page.evaluate((viewport) => {
      const issues = [];
      const elements = [
        { sel: '.enemy-side', name: '적 영역' },
        { sel: '.my-side', name: '내 영역' },
        { sel: '.center-area', name: '중앙 영역' },
        { sel: '.bottom-panel', name: '하단 패널' },
        { sel: '#playerHand', name: '핸드' },
        { sel: '.avatar', name: '아바타' },
      ];
      
      elements.forEach(({ sel, name }) => {
        const el = document.querySelector(sel);
        if (!el) {
          issues.push(`❌ ${name} (${sel}): 요소 없음`);
          return;
        }
        const rect = el.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) {
          issues.push(`❌ ${name}: 크기 0 (보이지 않음)`);
        }
        if (rect.top < -10) {
          issues.push(`⚠️ ${name}: 위로 벗어남 (top: ${rect.top.toFixed(0)}px)`);
        }
        if (rect.bottom > viewport.height + 10) {
          issues.push(`⚠️ ${name}: 아래로 벗어남 (bottom: ${rect.bottom.toFixed(0)}px > ${viewport.height}px)`);
        }
        if (rect.left < -10) {
          issues.push(`⚠️ ${name}: 왼쪽 벗어남 (left: ${rect.left.toFixed(0)}px)`);
        }
        if (rect.right > viewport.width + 10) {
          issues.push(`⚠️ ${name}: 오른쪽 벗어남 (right: ${rect.right.toFixed(0)}px > ${viewport.width}px)`);
        }
      });
      
      return issues;
    }, VIEWPORT);
    
    issues.push(...outOfBounds);
    
    // 요소 겹침 체크
    const overlaps = await page.evaluate(() => {
      const issues = [];
      const hand = document.querySelector('#playerHand');
      const controls = document.querySelector('.controls-bar');
      
      if (hand && controls) {
        const handRect = hand.getBoundingClientRect();
        const ctrlRect = controls.getBoundingClientRect();
        
        const overlap = !(handRect.right < ctrlRect.left || 
                         handRect.left > ctrlRect.right || 
                         handRect.bottom < ctrlRect.top || 
                         handRect.top > ctrlRect.bottom);
        
        if (overlap) {
          issues.push('⚠️ 핸드와 버튼이 겹침');
        }
      }
      
      return issues;
    });
    
    issues.push(...overlaps);
    
    // 5. 결과 출력
    console.log('\n' + '='.repeat(50));
    if (issues.length === 0) {
      console.log('✅ UI 검수 통과! 문제 없음');
    } else {
      console.log(`⚠️ UI 검수 결과: ${issues.length}개 이슈 발견\n`);
      issues.forEach(issue => console.log('  ' + issue));
    }
    console.log('='.repeat(50));
    
    // 스크린샷 경로 출력
    console.log(`\n📁 스크린샷: ${screenshotDir}/`);
    
  } catch (err) {
    console.error('❌ 검수 실패:', err.message);
    issues.push(`ERROR: ${err.message}`);
  } finally {
    await browser.close();
  }
  
  return issues.length === 0;
}

// 실행
checkUI().then(passed => {
  process.exit(passed ? 0 : 1);
});
