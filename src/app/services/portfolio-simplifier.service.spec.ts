import { TestBed } from '@angular/core/testing';
import { PortfolioSimplifierService } from './portfolio-simplifier.service';
import { InvestorProfile } from '../pages/portfolio-simplifier/portfolio-config.data';

describe('PortfolioSimplifierService Grid Tests', () => {
  let service: PortfolioSimplifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioSimplifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const profiles: InvestorProfile[] = ['Conservative', 'Balanced', 'Aggressive'];
  const goldOptions: boolean[] = [true, false];
  const amounts: number[] = [0, 50000, 100000, 500000];

  // Test across full age range 18 to 80 step 1
  for (let age = 18; age <= 80; age += 1) {
    profiles.forEach(profile => {
      goldOptions.forEach(gold => {
        it(`should calculate correctly for age=${age}, profile=${profile}, gold=${gold}`, () => {
          const res = service.calculate(age, profile, gold, 100000);
          expect(res.methods.length).toBeGreaterThan(0);

          res.methods.forEach(m => {
            // Verify items rounded sum to 100%
            const sum = m.items.reduce((acc, curr) => acc + curr.rounded, 0);
            expect(Math.round(sum * 10) / 10).toBe(100);

            // Verify gold behavior
            const goldItem = m.items.find(i => i.key === 'gold');
            if (gold) {
              expect(goldItem).toBeDefined();
              const expectedGold = profile === 'Conservative' ? 10 : profile === 'Balanced' ? 7.5 : 5;
              expect(goldItem!.rounded).toBe(expectedGold);
            } else {
              expect(goldItem).toBeUndefined();
            }

            // Verify Core and Satellite split
            const coreItem = m.items.find(i => i.key === 'core');
            const satItem = m.items.find(i => i.key === 'sat');
            expect(coreItem).toBeDefined();
            expect(satItem).toBeDefined();
            expect(coreItem!.rounded).toBeGreaterThanOrEqual(0);
            expect(satItem!.rounded).toBeGreaterThanOrEqual(0);
          });
        });
      });
    });
  }

  it('should calculate monetary amounts accurately when totalAmount is provided', () => {
    const res = service.calculate(30, 'Balanced', true, 200000);
    const method = res.methods[0];
    const totalAllocated = method.items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    expect(Math.round(totalAllocated)).toBe(200000);
  });
});
