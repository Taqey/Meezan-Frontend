import { Injectable } from '@angular/core';
import { InvestorProfile, PORTFOLIO_CONFIG, PortfolioMethodConfig } from '../pages/portfolio-simplifier/portfolio-config.data';

export interface PortfolioAllocationItem {
  key: 'gold' | 'bonds' | 'core' | 'sat';
  label: string;
  val: number;
  rounded: number;
  amount?: number;
  color: string;
  hint?: string;
}

export interface MethodResult {
  name: string;
  sourceTopicKeys: string[];
  adv: string;
  dis: string;
  items: PortfolioAllocationItem[];
  stocksRatio: number;
  bondsRatio: number;
  remainder: number;
  goldPct: number;
  stocksPortionOfTotal: number;
  corePortionOfTotal: number;
  satellitePortionOfTotal: number;
  coreSharePct: number;
  satSharePct: number;
}

export interface CalculationResult {
  age: number;
  profile: InvestorProfile;
  includeGold: boolean;
  totalAmount: number;
  methods: MethodResult[];
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioSimplifierService {
  readonly config = PORTFOLIO_CONFIG;

  calculate(age: number, profileKey: InvestorProfile, includeGold: boolean, totalAmount = 0): CalculationResult {
    const profileData = this.config.profiles[profileKey];
    const goldPct = includeGold ? profileData.goldShare : 0;
    const remainder = 1 - goldPct;
    const methods = profileData.methods;

    const methodResults: MethodResult[] = methods.map((method: PortfolioMethodConfig) => {
      let sRatio: number;
      let bRatio: number;

      if (method.type === 'age' && method.calc) {
        const res = method.calc(age);
        sRatio = res.stocks;
        bRatio = res.bonds;
      } else {
        sRatio = method.stocks ?? 0;
        bRatio = method.bonds ?? 0;
      }

      const stocksPortionOfTotal = remainder * sRatio;
      const bondsPortionOfTotal = remainder * bRatio;

      const coreSharePct = profileData.coreShare;
      const satSharePct = profileData.satelliteShare;

      const corePortionOfTotal = stocksPortionOfTotal * coreSharePct;
      const satellitePortionOfTotal = stocksPortionOfTotal * satSharePct;

      const rawGold = goldPct * 100;
      const rawBonds = bondsPortionOfTotal * 100;
      const rawCore = corePortionOfTotal * 100;
      const rawSat = satellitePortionOfTotal * 100;

      let items: PortfolioAllocationItem[] = [
        { key: 'gold', label: this.config.labels.gold, val: rawGold, rounded: 0, color: '#f59e0b' },
        { key: 'bonds', label: this.config.labels.bonds, val: rawBonds, rounded: 0, color: '#3b82f6' },
        { key: 'core', label: this.config.labels.core, val: rawCore, rounded: 0, color: '#10b981' },
        { key: 'sat', label: profileData.satelliteLabel, val: rawSat, rounded: 0, color: '#8b5cf6', hint: profileData.satelliteHint }
      ];

      items = items.filter(item => item.key !== 'gold' || includeGold);

      let roundedSum = 0;
      items.forEach(item => {
        item.rounded = Math.round(item.val * 10) / 10;
        roundedSum += item.rounded;
      });

      const diff = Math.round((100 - roundedSum) * 10) / 10;
      if (Math.abs(diff) > 0.001 && items.length > 0) {
        const largest = items.reduce((max, curr) => curr.val > max.val ? curr : max, items[0]);
        largest.rounded = Math.round((largest.rounded + diff) * 10) / 10;
      }

      if (totalAmount > 0) {
        items.forEach(item => {
          item.amount = (item.rounded / 100) * totalAmount;
        });
      }

      return {
        name: method.name,
        sourceTopicKeys: method.sourceTopicKeys,
        adv: method.adv,
        dis: method.dis,
        items,
        stocksRatio: sRatio,
        bondsRatio: bRatio,
        remainder,
        goldPct,
        stocksPortionOfTotal,
        corePortionOfTotal,
        satellitePortionOfTotal,
        coreSharePct,
        satSharePct
      };
    });

    return {
      age,
      profile: profileKey,
      includeGold,
      totalAmount,
      methods: methodResults
    };
  }
}
