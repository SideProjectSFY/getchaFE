<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title getcha-brand-text">Getcha</h3>
          <p class="footer-description">애니 덕후들을 위한 굿즈 경매 플랫폼</p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">고객센터</h4>
          <p class="contact-info">
            문의 전화: <a href="tel:1588-0000" class="contact-link">1588-0000</a>
          </p>
          <p class="contact-info">
            운영시간: 평일 09:00 - 18:00
          </p>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">서비스</h4>
          <ul class="footer-links">
            <li><router-link to="/goods">굿즈 둘러보기</router-link></li>
            <li><router-link to="/goods/register">굿즈 등록</router-link></li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 <span class="getcha-brand-text">Getcha</span>. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  background: #ffffff;
  color: var(--text-dark);
  margin-top: 80px;
  padding: 60px 0 30px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 30px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-title {
  font-size: 28px;
  font-weight: 400;
  font-family: 'Rubik Bubbles', 'Modak', 'Rubik', 'Inter', 'Noto Sans KR', sans-serif;
  color: var(--primary-red);
  margin-bottom: 8px;
}

.footer-description {
  color: rgba(26, 26, 26, 0.7);
  font-size: 14px;
}

.footer-subtitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.contact-info {
  color: rgba(26, 26, 26, 0.75);
  font-size: 14px;
  margin-bottom: 8px;
}

.contact-link {
  color: var(--primary-red-light);
  text-decoration: none;
  transition: var(--transition);
}

.contact-link:hover {
  color: var(--primary-red);
  text-decoration: underline;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-links a {
  color: rgba(26, 26, 26, 0.75);
  font-size: 14px;
  transition: var(--transition);
}

.footer-links a:hover {
  color: var(--primary-red);
}

.footer-bottom {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 24px;
  text-align: center;
  color: rgba(26, 26, 26, 0.6);
  font-size: 13px;
}
</style>

