export type InvestorProfile = 'Conservative' | 'Balanced' | 'Aggressive';

export interface PortfolioMethodConfig {
  name: string;
  type: 'age' | 'fixed';
  sourceTopicKeys: string[];
  stocks?: number;
  bonds?: number;
  calc?: (age: number) => { stocks: number; bonds: number };
  adv: string;
  dis: string;
}

export interface ProfileConfig {
  goldShare: number;
  stocksRatio?: number;
  bondsRatio?: number;
  coreShare: number;
  satelliteShare: number;
  satelliteLabel: string;
  satelliteHint: string;
  methods: PortfolioMethodConfig[];
}

export const PORTFOLIO_CONFIG: {
  profiles: Record<InvestorProfile, ProfileConfig>;
  labels: {
    gold: string;
    bonds: string;
    core: string;
  };
} = {
  profiles: {
    Conservative: {
      goldShare: 0.10,
      stocksRatio: 0.40,
      bondsRatio: 0.60,
      coreShare: 0.80,
      satelliteShare: 0.20,
      satelliteLabel: "Defensive Sector Funds",
      satelliteHint: "الدفاعي (طلب ثابت وبيثبت وقت الهبوط): صندوق القطاع الاستهلاكي",
      methods: [
        {
          name: "100 − Age",
          type: "age",
          sourceTopicKeys: ["age_rules"],
          calc: (age: number) => {
            const b = age / 100;
            const s = 1 - b;
            return { stocks: s, bonds: b };
          },
          adv: "يقلل من إغراء توقيت السوق (Market Timing)، ويفرض عملية إعادة التوازن دورياً.",
          dis: "ترى مورنينغستار أن القواعد المعتمدة على السن قد تكون متحفظة أكثر من اللازم؛ وقد انتقل جون بوغل إلى 120 لأن القاعدة القديمة وُلدت في عصر كانت فيه عائدات السندات أعلى."
        },
        {
          name: "Vanguard LifeStrategy (Conservative)",
          type: "fixed",
          sourceTopicKeys: ["vanguard_lifestrategy"],
          stocks: 0.40,
          bonds: 0.60,
          adv: "مصدر مؤسسي صريح ومعتمد عالمياً.",
          dis: "يفتقر إلى سند قوي فريد خارج نطاق المؤسسة المصدرة."
        },
        {
          name: "Couch Potato (Scott Burns)",
          type: "fixed",
          sourceTopicKeys: ["couch_potato"],
          stocks: 0.50,
          bonds: 0.50,
          adv: "سجل المؤلف أن أسوأ خسارة له كانت 10% في عام 1974، بعائد سنوي 10.29% مقابل 10.56% للأسهم وحدها في فترة دراسته.",
          dis: "المصدر هو المؤلف نفسه، لذلك فهو ليس محايداً تماماً."
        }
      ]
    },
    Balanced: {
      goldShare: 0.075,
      coreShare: 0.70,
      satelliteShare: 0.30,
      satelliteLabel: "Defensive + Growth Sector Funds (mix)",
      satelliteHint: "الدفاعي (طلب ثابت وبيثبت وقت الهبوط): صندوق القطاع الاستهلاكي | النمو/الهجومي (بيستفيد من التوسع الاقتصادي): صناديق القطاع المالي، العقاري ومواد البناء، الصناعي، التكنولوجي",
      methods: [
        {
          name: "110 − Age",
          type: "age",
          sourceTopicKeys: ["age_rules"],
          calc: (age: number) => {
            const s = Math.max(0, Math.min(1, (110 - age) / 100));
            const b = 1 - s;
            return { stocks: s, bonds: b };
          },
          adv: "يوصي به الكثير من المخططين الماليين (110 أو 120) نظراً لأن البشر يعيشون لفترات أطول ويحتاجون لنمو أعلى.",
          dis: "قد يمنح نمواً ضعيفاً نسبياً للتقاعد؛ كما أن السن ليس العامل الوحيد لتحديد المخاطر."
        },
        {
          name: "Vanguard LifeStrategy (60/40)",
          type: "fixed",
          sourceTopicKeys: ["vanguard_lifestrategy"],
          stocks: 0.60,
          bonds: 0.40,
          adv: "معيار كلاسيكي متوازن ومختبر تاريخياً.",
          dis: "قد لا يناسب الأهداف التي تختلف أفقها الزمني عن المتوسط العام."
        }
      ]
    },
    Aggressive: {
      goldShare: 0.05,
      coreShare: 0.60,
      satelliteShare: 0.40,
      satelliteLabel: "Growth (Aggressive) Sector Funds",
      satelliteHint: "النمو/الهجومي (بيستفيد من التوسع الاقتصادي): صناديق القطاع المالي، العقاري ومواد البناء، الصناعي، التكنولوجي",
      methods: [
        {
          name: "120 − Age",
          type: "age",
          sourceTopicKeys: ["age_rules"],
          calc: (age: number) => {
            const s = Math.max(0, Math.min(1, (120 - age) / 100));
            const b = 1 - s;
            return { stocks: s, bonds: b };
          },
          adv: "تراه فيديليتي ملائماً للمستثمرين القادرين على تحمل مخاطر أعلى؛ دافع عنه جون بوغل؛ واقترح بينغن 128 - السن لعمليات السحب المستدامة.",
          dis: "يُجادل كايتس وففاو بأن تقليل الأسهم حول سن التقاعد يقلل من مخاطر تسلسل العوائد (Sequence-of-returns risk)."
        },
        {
          name: "Vanguard LifeStrategy (Aggressive)",
          type: "fixed",
          sourceTopicKeys: ["vanguard_lifestrategy"],
          stocks: 0.80,
          bonds: 0.20,
          adv: "نسبة نمو عالية للمدى الطويل بدعم مؤسسي.",
          dis: "تقلبات عالية قد لا يتحملها المستثمر الضعيف نفسياً."
        },
        {
          name: "Buffett 90/10",
          type: "fixed",
          sourceTopicKeys: ["buffett_90_10"],
          stocks: 0.90,
          bonds: 0.10,
          adv: "تكلفة منخفضة وبساطة مطلقة (أوصى به وارن باففت لورثته).",
          dis: "المحافظ ذات النسبة الأعلى من السندات (مثل 70/30 أو 60/40) أكثر استقراراً؛ ومن قرب تقاعدهم قد يحتاجون سندات أكثر."
        }
      ]
    }
  },
  labels: {
    gold: "صندوق ذهب / ذهب",
    bonds: "صندوق دخل ثابت / سندات (عام)",
    core: "صندوق مؤشرات (Index Fund) يتتبع السوق المصري"
  }
};
