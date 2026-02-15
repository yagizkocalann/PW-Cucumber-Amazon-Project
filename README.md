# Playwright + Cucumber (TS) Automation

Amazon.com.tr icin ornek E2E otomasyon yapisi.

## Kurulum

```bash
npm install
npx playwright install
```

## Calistirma

```bash
npm run test:e2e
```

Basliksiz (headed) calistirma:

```bash
npm run test:e2e:headed
```

Tarayici secimi:

```bash
npm run test:e2e:browser:firefox
npm run test:e2e:browser:webkit
```

## Rapor (HTML)

Testler calistikten sonra HTML rapor almak icin:

```bash
npm run report:html
```

Rapor dosyasi: `reports/cucumber-report.html`

Otomatik acmak icin:

```bash
OPEN_REPORT=true npm run test:e2e
```

Not: `npm run test:e2e` artik test basarisiz olsa bile rapor uretir.

## Klasor Yapisi

- `features/` Gherkin senaryolari
- `src/pages/` Page Object katmani
- `src/steps/` Step definitions
- `src/support/` Hooks ve World yapisi
- `src/config/` Ortam degiskenleri ve config
- `reports/` Cucumber raporlari (JSON)
- `artifacts/` Ekran goruntuleri

## Test Kalite Standartlari

Varsayilan (acik) kalite kontrolleri:
- Sayfa basligi bos degil (`page.title()`).
- URL, `baseUrl` origin'ini icerir.
- Arama sayfasi ise sonuc listesi bos degil (ASIN'li urun karti sayisi > 0).
- Her adim sonrasi ana icerik gorunur:
  `div.s-main-slot` (arama sayfasi) veya `#twotabsearchtextbox` (home).

Opsiyonel sentinel kontrolleri (varsayilan kapali):
- "Uzgunuz / Sorry / 404 / bu sayfa bulunamadi / captcha / robot dogrulama"
  gibi hata metinleri yok.
- Captcha tespit edilirse acik hata mesaji firlatilir.

Fail aninda raporlama:
- Scenario adi, URL ve screenshot path loglanir.
- Console error ve 4xx/5xx HTTP loglari yazdirilir (varsa).

Arama sonucu dogrulamasi:
- "Ilk urun" yerine sonuc listesinde herhangi bir urun basligi keyword icerir.
- Eslesme yoksa, 5 ornek baslikla acik hata doner.

Opsiyonel fail kosullari:
- `FAIL_ON_CONSOLE_ERROR=true` -> console error'lari test fail eder.
- `FAIL_ON_HTTP_ERROR=true` -> 4xx/5xx response'lar test fail eder.

Kalite kontrol flag'leri:
- `SANITY_CHECKS` (default `true`)
- `SANITY_SEARCH_RESULTS` (default `true`)
- `SANITY_STEP_CONTENT` (default `true`)
- `SANITY_SENTINELS` (default `false`)
