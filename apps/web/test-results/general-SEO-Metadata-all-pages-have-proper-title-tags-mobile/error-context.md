# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: general.spec.ts >> SEO & Metadata >> all pages have proper title tags
- Location: e2e/general.spec.ts:85:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3001/articles", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "द Drishti Nepal दृष्टि नेपाल" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: द
        - generic [ref=e6]:
          - generic [ref=e7]: Drishti Nepal
          - generic [ref=e8]: दृष्टि नेपाल
      - generic [ref=e9]:
        - link "Search" [ref=e10] [cursor=pointer]:
          - /url: /search
          - img [ref=e11]
        - group "Language selector" [ref=e14]:
          - button "EN" [pressed] [ref=e15]
          - button "नेपाली" [ref=e16] [cursor=pointer]
        - button "Open menu" [ref=e17]:
          - img [ref=e18]
  - main [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - heading "Articles & Analysis" [level=1] [ref=e23]
        - paragraph [ref=e24]: Bilingual accountability reports from AI agents and human experts.
      - generic [ref=e25]:
        - link "news_update AI Generated Habeas Corpus Petition Filed for Release of Former Home Minister Ramesh Lekhak पूर्वगृहमन्त्री रमेश लेखकको रिहाईको लागि बन्दी प्रत्यक्षीकरण रिट दायर A habeas corpus writ has been filed at Nepal's Supreme Court demanding the release of former Home Minister Ramesh Lekhak, alleging illegal detention. A separate petition has also been filed for former PM KP Oli. March 29, 2026" [ref=e26] [cursor=pointer]:
          - /url: /articles/2026-03-29-habeas-corpus-petition-filed-for-release-of-former-home-minister-ramesh-lekhak
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e29]: news_update
              - generic [ref=e30]: AI Generated
            - heading "Habeas Corpus Petition Filed for Release of Former Home Minister Ramesh Lekhak" [level=2] [ref=e31]
            - paragraph [ref=e32]: पूर्वगृहमन्त्री रमेश लेखकको रिहाईको लागि बन्दी प्रत्यक्षीकरण रिट दायर
            - paragraph [ref=e33]: A habeas corpus writ has been filed at Nepal's Supreme Court demanding the release of former Home Minister Ramesh Lekhak, alleging illegal detention. A separate petition has also been filed for former PM KP Oli.
          - time [ref=e35]: March 29, 2026
        - link "news_update AI Generated Parliamentary Debate on Ravi Lamichhane's Amendment Issue Concludes रवि लामिछानेको मुद्दा संशोधनविरुद्धको बहस सकियो The parliamentary debate regarding allegations against Home Minister Ravi Lamichhane has concluded. The discussion centered on his alleged connection to a cooperative fund case. March 29, 2026" [ref=e36] [cursor=pointer]:
          - /url: /articles/2026-03-29-parliamentary-debate-on-ravi-lamichhanes-amendment-issue-concludes
          - generic [ref=e37]:
            - generic [ref=e38]:
              - generic [ref=e39]: news_update
              - generic [ref=e40]: AI Generated
            - heading "Parliamentary Debate on Ravi Lamichhane's Amendment Issue Concludes" [level=2] [ref=e41]
            - paragraph [ref=e42]: रवि लामिछानेको मुद्दा संशोधनविरुद्धको बहस सकियो
            - paragraph [ref=e43]: The parliamentary debate regarding allegations against Home Minister Ravi Lamichhane has concluded. The discussion centered on his alleged connection to a cooperative fund case.
          - time [ref=e45]: March 29, 2026
        - link "news_update AI Generated MoCIT Directs NTA to Ban Betting Apps Within 24 Hours बेटिङ एप २४ घण्टाभित्र बन्द गर्न सञ्चार मन्त्रालयको निर्देशन The Ministry of Communication and Information Technology has directed the Nepal Telecommunications Authority to shut down online betting apps within 24 hours, initiating a crackdown on unregulated digital gambling platforms. March 29, 2026" [ref=e46] [cursor=pointer]:
          - /url: /articles/2026-03-29-mocit-directs-nta-to-ban-betting-apps-within-24-hours
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: news_update
              - generic [ref=e50]: AI Generated
            - heading "MoCIT Directs NTA to Ban Betting Apps Within 24 Hours" [level=2] [ref=e51]
            - paragraph [ref=e52]: बेटिङ एप २४ घण्टाभित्र बन्द गर्न सञ्चार मन्त्रालयको निर्देशन
            - paragraph [ref=e53]: The Ministry of Communication and Information Technology has directed the Nepal Telecommunications Authority to shut down online betting apps within 24 hours, initiating a crackdown on unregulated digital gambling platforms.
          - time [ref=e55]: March 29, 2026
        - link "news_update AI Generated Supreme Court to Hear Ravi Lamichhane's Amendment Case Before Full Bench रवि लामिछानेको मुद्दा संशोधनसम्बन्धी रिट पूर्ण इजलासमा सुनुवाइ हुने The Supreme Court of Nepal has ordered that a writ petition challenging the amendment of legal charges against Deputy Prime Minister and Home Minister Ravi Lamichhane be heard before a full bench, citing the case's significance. March 29, 2026" [ref=e56] [cursor=pointer]:
          - /url: /articles/2026-03-29-supreme-court-to-hear-ravi-lamichhanes-amendment-case-before-full-bench
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]: news_update
              - generic [ref=e60]: AI Generated
            - heading "Supreme Court to Hear Ravi Lamichhane's Amendment Case Before Full Bench" [level=2] [ref=e61]
            - paragraph [ref=e62]: रवि लामिछानेको मुद्दा संशोधनसम्बन्धी रिट पूर्ण इजलासमा सुनुवाइ हुने
            - paragraph [ref=e63]: The Supreme Court of Nepal has ordered that a writ petition challenging the amendment of legal charges against Deputy Prime Minister and Home Minister Ravi Lamichhane be heard before a full bench, citing the case's significance.
          - time [ref=e65]: March 29, 2026
        - link "cabinet_decision AI Generated Government unveils ambitious 100-point roadmap for effective governance सरकारले प्रभावकारी शासनका लागि महत्त्वाकांक्षी १०० बुँदे कार्ययोजना सार्वजनिक गर्‍यो The Balendra Shah administration's first cabinet approved a 100-point roadmap covering asset investigation, ministry restructuring, student org abolition, and free hospital beds. March 29, 2026" [ref=e66] [cursor=pointer]:
          - /url: /articles/2026-03-29-government-unveils-100-point-roadmap
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e69]: cabinet_decision
              - generic [ref=e70]: AI Generated
            - heading "Government unveils ambitious 100-point roadmap for effective governance" [level=2] [ref=e71]
            - paragraph [ref=e72]: सरकारले प्रभावकारी शासनका लागि महत्त्वाकांक्षी १०० बुँदे कार्ययोजना सार्वजनिक गर्‍यो
            - paragraph [ref=e73]: The Balendra Shah administration's first cabinet approved a 100-point roadmap covering asset investigation, ministry restructuring, student org abolition, and free hospital beds.
          - time [ref=e75]: March 29, 2026
        - link "news_update AI Generated CIB arrests ex-minister Khadka in money laundering probe CIB ले पूर्वमन्त्री खड्कालाई मनी लाउन्डरिङ अनुसन्धानमा पक्राउ गर्‍यो CIB arrests former energy minister Deepak Khadka following a Department of Money Laundering Investigation request. Forensic tests confirmed burnt banknote fragments at his residence. March 29, 2026" [ref=e76] [cursor=pointer]:
          - /url: /articles/2026-03-29-cib-arrests-ex-minister-khadka-money-laundering
          - generic [ref=e77]:
            - generic [ref=e78]:
              - generic [ref=e79]: news_update
              - generic [ref=e80]: AI Generated
            - heading "CIB arrests ex-minister Khadka in money laundering probe" [level=2] [ref=e81]
            - paragraph [ref=e82]: CIB ले पूर्वमन्त्री खड्कालाई मनी लाउन्डरिङ अनुसन्धानमा पक्राउ गर्‍यो
            - paragraph [ref=e83]: CIB arrests former energy minister Deepak Khadka following a Department of Money Laundering Investigation request. Forensic tests confirmed burnt banknote fragments at his residence.
          - time [ref=e85]: March 29, 2026
        - link "Editorial Human Written Understanding The Drishti Nepal Scorecard A brief explanation of how our scoring system works to track manifesto promises against real-world government actions. March 29, 2026" [ref=e86] [cursor=pointer]:
          - /url: /articles/understanding-the-scorecard
          - generic [ref=e87]:
            - generic [ref=e88]:
              - generic [ref=e89]: Editorial
              - generic [ref=e90]: Human Written
            - heading "Understanding The Drishti Nepal Scorecard" [level=2] [ref=e91]
            - paragraph [ref=e92]: A brief explanation of how our scoring system works to track manifesto promises against real-world government actions.
          - time [ref=e94]: March 29, 2026
        - link "Editorial Human Written Welcome to Our New Articles Section This is the first post in our new, human-written articles section, powered by a simple, git-based workflow. March 29, 2026" [ref=e95] [cursor=pointer]:
          - /url: /articles/first-post
          - generic [ref=e96]:
            - generic [ref=e97]:
              - generic [ref=e98]: Editorial
              - generic [ref=e99]: Human Written
            - heading "Welcome to Our New Articles Section" [level=2] [ref=e100]
            - paragraph [ref=e101]: This is the first post in our new, human-written articles section, powered by a simple, git-based workflow.
          - time [ref=e103]: March 29, 2026
  - contentinfo [ref=e104]:
    - generic [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]: द
            - generic [ref=e110]:
              - paragraph [ref=e111]: Drishti Nepal
              - paragraph [ref=e112]: दृष्टि नेपाल
          - paragraph [ref=e113]: Holding Nepal's government accountable through transparent, AI-powered tracking.
        - generic [ref=e114]:
          - heading "Portal" [level=4] [ref=e115]
          - list [ref=e116]:
            - listitem [ref=e117]:
              - link "Ministers" [ref=e118] [cursor=pointer]:
                - /url: /ministers
            - listitem [ref=e119]:
              - link "Cabinet Decisions" [ref=e120] [cursor=pointer]:
                - /url: /decisions
            - listitem [ref=e121]:
              - link "Manifesto Tracker" [ref=e122] [cursor=pointer]:
                - /url: /manifesto
            - listitem [ref=e123]:
              - link "Score Dashboard" [ref=e124] [cursor=pointer]:
                - /url: /scores
        - generic [ref=e125]:
          - heading "Participate" [level=4] [ref=e126]
          - list [ref=e127]:
            - listitem [ref=e128]:
              - link "Submit Evidence" [ref=e129] [cursor=pointer]:
                - /url: /submit
            - listitem [ref=e130]:
              - link "Read Analysis" [ref=e131] [cursor=pointer]:
                - /url: /articles
            - listitem [ref=e132]:
              - link "GitHub" [ref=e133] [cursor=pointer]:
                - /url: https://github.com/rrijal1/DrishtiNepal
            - listitem [ref=e134]:
              - link "About Us" [ref=e135] [cursor=pointer]:
                - /url: /about
        - generic [ref=e136]:
          - heading "Follow Us" [level=4] [ref=e137]
          - list [ref=e138]:
            - listitem [ref=e139]:
              - link "Facebook" [ref=e140] [cursor=pointer]:
                - /url: https://facebook.com/DrishtiNepalHQ
            - listitem [ref=e141]:
              - link "X (Twitter)" [ref=e142] [cursor=pointer]:
                - /url: https://x.com/DrishtiNepalHQ
            - listitem [ref=e143]:
              - link "Instagram" [ref=e144] [cursor=pointer]:
                - /url: https://www.instagram.com/drishtinepal_hq/
          - generic [ref=e145]:
            - heading "Methodology" [level=4] [ref=e146]
            - paragraph [ref=e147]:
              - text: All scoring is
              - link "publicly documented" [ref=e148] [cursor=pointer]:
                - /url: /methodology
              - text: . AI-generated content is clearly labeled.
      - paragraph [ref=e150]: © 2026 Drishti Nepal. Open source under MIT License. Non-partisan civic technology.
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | test.describe("Static Pages", () => {
  4   |   test("about page renders", async ({ page }) => {
  5   |     await page.goto("/about");
  6   |     const heading = page.getByRole("heading", { level: 1 });
  7   |     await expect(heading).toBeVisible();
  8   |   });
  9   | 
  10  |   test("methodology page renders", async ({ page }) => {
  11  |     await page.goto("/methodology");
  12  |     const heading = page.getByRole("heading", { level: 1 });
  13  |     await expect(heading).toBeVisible();
  14  |   });
  15  | 
  16  |   test("moderate page renders without crash", async ({ page }) => {
  17  |     await page.goto("/moderate");
  18  |     const heading = page.getByRole("heading", { level: 1 });
  19  |     await expect(heading).toBeVisible();
  20  |   });
  21  | });
  22  | 
  23  | test.describe("Language Toggle", () => {
  24  |   test("language toggle is visible in header", async ({ page }) => {
  25  |     await page.goto("/");
  26  |     // The language toggle uses aria-pressed buttons
  27  |     const toggle = page.locator("button[aria-pressed]");
  28  |     await expect(toggle.first()).toBeVisible();
  29  |   });
  30  | 
  31  |   test("switching language updates content", async ({ page }) => {
  32  |     await page.goto("/");
  33  |     // Get initial hero title text
  34  |     const h1 = page.locator("h1");
  35  |     const initialText = await h1.textContent();
  36  | 
  37  |     // Click Nepali toggle button (text is "नेपाली")
  38  |     const npButton = page.locator("button[aria-pressed]").last();
  39  |     if (await npButton.isVisible()) {
  40  |       await npButton.click();
  41  |       // router.refresh() triggers a re-render — wait for it
  42  |       await page.waitForTimeout(1500);
  43  |       const newText = await h1.textContent();
  44  |       // Text should be different (Nepali vs English) or at least page didn't crash
  45  |       expect(newText?.length).toBeGreaterThan(0);
  46  |     }
  47  |   });
  48  | });
  49  | 
  50  | test.describe("Responsive Layout", () => {
  51  |   test("content is contained within max-width on desktop", async ({ page }) => {
  52  |     test.skip((page.viewportSize()?.width ?? 1280) < 768, "Desktop-only test");
  53  |     await page.goto("/");
  54  |     const container = page.locator(".max-w-7xl").first();
  55  |     await expect(container).toBeVisible();
  56  |   });
  57  | 
  58  |   test("no horizontal scrollbar on mobile", async ({ page }) => {
  59  |     test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only test");
  60  |     await page.goto("/");
  61  |     const overflowDiff = await page.evaluate(
  62  |       () =>
  63  |         document.documentElement.scrollWidth -
  64  |         document.documentElement.clientWidth,
  65  |     );
  66  |     // Allow up to 5px tolerance for minor overflow
  67  |     expect(overflowDiff).toBeLessThanOrEqual(5);
  68  |   });
  69  | 
  70  |   test("minister cards stack on mobile", async ({ page }) => {
  71  |     test.skip((page.viewportSize()?.width ?? 1280) >= 768, "Mobile-only test");
  72  |     await page.goto("/ministers");
  73  |     const grid = page.locator(".grid").first();
  74  |     if (await grid.isVisible()) {
  75  |       const gridStyle = await grid.evaluate((el) =>
  76  |         getComputedStyle(el).getPropertyValue("grid-template-columns"),
  77  |       );
  78  |       // On mobile, should be single column or minimal columns
  79  |       expect(gridStyle).toBeDefined();
  80  |     }
  81  |   });
  82  | });
  83  | 
  84  | test.describe("SEO & Metadata", () => {
  85  |   test("all pages have proper title tags", async ({ page }) => {
  86  |     const routes = [
  87  |       "/",
  88  |       "/ministers",
  89  |       "/manifesto",
  90  |       "/scores",
  91  |       "/decisions",
  92  |       "/articles",
  93  |       "/about",
  94  |       "/methodology",
  95  |       "/submit",
  96  |       "/search",
  97  |     ];
  98  | 
  99  |     for (const route of routes) {
> 100 |       await page.goto(route);
      |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  101 |       const title = await page.title();
  102 |       expect(title.length, `Missing title on ${route}`).toBeGreaterThan(0);
  103 |     }
  104 |   });
  105 | 
  106 |   test("OG tags present on home page", async ({ page }) => {
  107 |     await page.goto("/");
  108 |     const ogTitle = page.locator('meta[property="og:title"]');
  109 |     await expect(ogTitle).toHaveAttribute("content", /.+/);
  110 |     const ogDesc = page.locator('meta[property="og:description"]');
  111 |     await expect(ogDesc).toHaveAttribute("content", /.+/);
  112 |   });
  113 | 
  114 |   test("robots.txt is accessible", async ({ page }) => {
  115 |     const response = await page.goto("/robots.txt");
  116 |     expect(response?.status()).toBe(200);
  117 |   });
  118 | 
  119 |   test("sitemap.xml is accessible", async ({ page }) => {
  120 |     const response = await page.goto("/sitemap.xml");
  121 |     expect(response?.status()).toBe(200);
  122 |   });
  123 | });
  124 | 
  125 | test.describe("Error Handling", () => {
  126 |   test("404 page for non-existent route", async ({ page }) => {
  127 |     const response = await page.goto("/this-page-does-not-exist-xyz");
  128 |     expect(response?.status()).toBe(404);
  129 |   });
  130 | 
  131 |   test("non-existent minister ID shows 404", async ({ page }) => {
  132 |     const response = await page.goto(
  133 |       "/ministers/00000000-0000-0000-0000-000000000000",
  134 |     );
  135 |     // Should be 404 or redirect
  136 |     expect([404, 200]).toContain(response?.status());
  137 |   });
  138 | 
  139 |   test("no console errors on main pages", async ({ page }) => {
  140 |     const errors: string[] = [];
  141 |     page.on("console", (msg) => {
  142 |       if (msg.type() === "error") errors.push(msg.text());
  143 |     });
  144 | 
  145 |     await page.goto("/");
  146 |     await page.goto("/ministers");
  147 |     await page.goto("/manifesto");
  148 |     await page.goto("/scores");
  149 | 
  150 |     // Filter out benign errors (hydration warnings, fetch failures for data)
  151 |     const critical = errors.filter(
  152 |       (e) =>
  153 |         !e.includes("hydrat") &&
  154 |         !e.includes("fetch") &&
  155 |         !e.includes("Failed to load resource") &&
  156 |         !e.includes("Supabase"),
  157 |     );
  158 |     expect(critical).toHaveLength(0);
  159 |   });
  160 | });
  161 | 
```