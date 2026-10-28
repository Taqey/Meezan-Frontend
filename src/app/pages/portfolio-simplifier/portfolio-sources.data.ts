export interface PortfolioSource {
  title: string;
  summary: string;
  quote: string;
  links: string[];
  strength: 'strong' | 'medium' | 'weak' | 'none';
  strengthText: string;
}

export const PORTFOLIO_SOURCES: Record<string, PortfolioSource> = {
  core_satellite_ratios: {
    title: "1. نسب توزيع الكور/ساتلايت (Core / Satellite ratios)",
    summary: "تشرح الصفحات التعليمية من شركات الوساطة ومُصدري صناديق المؤشرات أن 'الكور' هو الجزء الأكبر والتراكمي السلبي (صناديق مؤشرات)، بينما 'الساتلايت' هو الجزء الأصغر والمركز (قطاع، فكرة، أو شركة). تعطي Saxo نسب 80/20 و 70/30 و 60/40 حسب ملف المخاطر؛ وتذكر Global X أن الكور غالبًا ما يمثل 60-90%؛ وتقترح eToro قاعدة 70/30 أو 80/20 للمستثمرين الأكثر تحفظًا؛ بينما تنوه CMC بأن 80/20 هي الأكثر شعبية مع توزيع الساتلايت على عدة أفكار.",
    quote: "",
    links: [
      "https://home.saxo/learn/guides/diversification/core-satellite-approach-a-smarter-way-to-diversify-your-investments",
      "https://www.globalxetfs.com.au/insights/post/core-satellite-investing-with-etfs/",
      "https://etoro.com/investing/core-satellite-portfolio",
      "https://www.cmcmarkets.com/en-gb/investing-guides/core-satellite-approach",
      "https://pearler.com/learn/read/what-is-a-core-satellite-approach"
    ],
    strength: "medium",
    strengthText: "متوسط — صفحات تعليمية لشركات وساطة"
  },
  defensive_vs_growth: {
    title: "2. تصنيف قطاعات الأسهم (Defensive vs Growth / Cyclical)",
    summary: "تصنف فيديليتي (Fidelity) قطاعات السلع الكمالية، الصناعة، والتكنولوجيا كقطاعات دورية/نمو (تستفيد أكثر من التوسع الاقتصادي)، بينما تصنف الرعاية الصحية، السلع الاستهلاكية الأساسية، والمرافق كقطاعات دفاعية (طلب مستقر وحماية في الأزمات). يرفع النمو العوائد في الانتعاش، والدفاعي يحمي رأس المال في الهبوط. (تنبيه: النفط دوري عند فيديليتي ودفاعي عند آخرين، والتكنولوجيا تضعها مورنينغستار في فئة متوسطة 'حساسة').",
    quote: "",
    links: [
      "https://www.fidelity.com/learning-center/trading-investing/markets-sectors/guide-to-industry-sectors",
      "https://www.ii.co.uk/analysis-commentary/analyst-best-sectors-each-phase-economic-cycle-ii535704",
      "https://awgmain.morningstar.com/webhelp/glossary_definitions/mutual_fund/glossary_all_Sectors.html",
      "https://www.etf.com/node/125820.md"
    ],
    strength: "strong",
    strengthText: "قوي — المرجعية (Fidelity / Morningstar)"
  },
  profile_mapping: {
    title: "3. ربط نوع المستثمر بنوع الساتلايت (Mapping investor type → Satellite type)",
    summary: "هذا الربط (تحفظي = دفاعي فقط، متوازن = مزيج 50/50، هجومي = نمو/دوري) هو دمج خاص بالبرنامج بين نسب الكور/ساتلايت وتصنيف القطاعات أعلاه؛ ولا يوجد مصدر واحد ينص على هذه المعادلة المحددة نصًا.",
    quote: "",
    links: [],
    strength: "none",
    strengthText: "افتراض مقترح — مفيش مصدر"
  },
  gold_pct: {
    title: "4. نسبة الذهب بالبرنامج (Gold percentage)",
    summary: "نسب الذهب المقترحة (تحفظي 10%، متوازن 7.5%، هجومي 5%) هي افتراض تنظيمي توجيهي تم اختياره للأداة لزيادة الحماية للتحفظي وتقليلها للهجومي، وليست مشتقة من دراسة مرجعية محددة.",
    quote: "",
    links: [],
    strength: "none",
    strengthText: "افتراض مقترح — مفيش مصدر"
  },
  age_rules: {
    title: "5. قواعد العُمر ('100 − Age', '110 − Age', '120 − Age')",
    summary: "تحدد قاعدة 100 نسبة السندات = العمر. ويوصي مخططون بـ 110 أو 120 لزيادة أفق النمو مع زيادة متوسط عمر البشر. تشير مورنينغستار إلى أن قواعد العمر القديمة قد تكون تحفظية أكثر من اللازم، وأن جون بوغل انتقل لـ 120 لأن القاعدة القديمة ظهرت في فترة عائدات سندات مرتفعة. وترى فيديليتي أن 120 تناسب من يتحمل مخاطر أعلى، بينما اقترح بينغن 128 - السن للسحب المستدام. في المقابل، يرى كايتس وففاو أن تقليل الأسهم قرب التقاعد يحمي من مخاطر تسلسل العوائد.",
    quote: "",
    links: [
      "https://www.morningstar.com.au/personal-finance/portfolio-rules-of-thumb-do-they-stack-up",
      "https://www.morningstar.com/markets/pinning-down-portfolio-rules-thumb",
      "https://morningstar.co.uk/uk/news/208975/4-investment-rules-of-thumb.aspx",
      "https://www-prd1.fidelity.ca/en/insights/articles/retirement-savings-stock-market",
      "https://www-prd1.fidelity.ca/en/insights/articles/common-asset-allocation-rules",
      "https://money.cnn.com/retirement/guide/investing_basics.moneymag/index7.htm",
      "https://www.fool.com/terms/r/rule-of-110"
    ],
    strength: "strong",
    strengthText: "قوي — (Morningstar / Fidelity) كقواعد تقريبية"
  },
  vanguard_lifestrategy: {
    title: "6. Vanguard LifeStrategy (Conservative 40/60, Balanced 60/40, Aggressive 80/20)",
    summary: "عائلة صناديق رسمية من شركة فانغارد تتبع نسبًا ثابتة ومباشرة بين الأسهم والسندات. مصدر مؤسسي صريح ومعتمد عالميًا كمرجعية قياسية.",
    quote: "",
    links: [
      "https://investor.vanguard.com/mutual-funds/lifestrategy"
    ],
    strength: "strong",
    strengthText: "قوي — مصدر مؤسسي مباشر (Vanguard)"
  },
  couch_potato: {
    title: "7. Couch Potato (Scott Burns) 50/50",
    summary: "طريقة سكوت بيرنز: نصف المحفظة في صندوق S&P 500 والنصف الآخر في صندوق سندات متوسطة الأجل مع إعادة توازن سنوية. سجل المؤلف أن أسوأ خسارة له كانت 10% في عام 1974 وحقق عائدًا 10.29% سنوياً مقابل 10.56% للأسهم الكاملة خلال فترة دراسته.",
    quote: "",
    links: [
      "https://scottburns.com/?p=56"
    ],
    strength: "weak",
    strengthText: "ضعيف إلى متوسط — المصدر هو المؤلف نفسه"
  },
  buffett_90_10: {
    title: "8. Buffett 90/10",
    summary: "نصيحة وارن باففت الشهيرة لورثته: 90% في صندوق مؤشر أسهم منخفض التكلفة (S&P 500) و 10% في سندات حكومية قصيرة الأجل. ترتكز على البساطة وخفض التكاليف. الرأي المقابل: المحافظ التي تحتوي سندات أكثر (60/40) أكثر استقرارًا لمن هم قرب التقاعد.",
    quote: "",
    links: [
      "https://www.fool.com/investing/2026/04/14/what-warren-buffett-would-buy-if-choose-two-etfs/",
      "https://www.fool.com/the-ascent/buying-stocks/articles/warren-buffett-loves-this-investing-strategy-should-you-try-it"
    ],
    strength: "medium",
    strengthText: "متوسط — إعلام مالي وتصريحات شهيرة"
  },
  egx_adaptation: {
    title: "9. تطبيق الطرق عالمية الأصل على البورصة المصرية (EGX)",
    summary: "جميع طرق الأسهم/السندات أعلاه نابعة من أسواق أمريكية وعالمية. تطبيقها على السوق المصري وتطبيق الكور-ساتلايت داخل حصة الأسهم فقط هو تكييف خاص بهذا البرنامج وليس طريقة منشور بها أوراق بحثية محددة.",
    quote: "",
    links: [],
    strength: "none",
    strengthText: "تكييف خاص بالبرنامج — مفيش مصدر"
  }
};
