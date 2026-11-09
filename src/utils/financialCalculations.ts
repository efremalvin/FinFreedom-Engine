import {
  AccumulationParams,
  AccumulationResult,
  AccumulationDataPoint,
  DecumulationParams,
  DecumulationResult,
  DecumulationDataPoint,
} from '@/types/simulator';

/**
 * Calculate Wealth Accumulation (Modul A)
 */
export function calculateAccumulation(params: {
  initialCapital?: number;
  monthlyInvestment: number;
  targetMonthlyExpense: number;
  annualReturn: number;
  annualInflation: number;
  timeHorizonYears: number;
  swrMultiplier: number;
}): AccumulationResult {
  const {
    initialCapital = 0,
    monthlyInvestment,
    targetMonthlyExpense,
    annualReturn,
    annualInflation,
    timeHorizonYears,
    swrMultiplier,
  } = params;

  const nominalRate = annualReturn / 100;
  const inflationRate = annualInflation / 100;
  const monthlyRate = nominalRate / 12;
  const realReturnRate = annualReturn - annualInflation;

  // Financial Freedom Target Number
  const targetFIRE = Math.round(targetMonthlyExpense * 12 * swrMultiplier);

  const dataPoints: AccumulationDataPoint[] = [];
  let yearReached: number | null = null;

  // Year 0 (Starting point: starts from 0 rupiah)
  const initCap = initialCapital || 0;
  const delta0 = initCap - targetFIRE;
  const deltaPercent0 = targetFIRE > 0 ? (delta0 / targetFIRE) * 100 : 0;
  const status0: 'surplus' | 'exact' | 'deficit' =
    delta0 > 0 ? 'surplus' : delta0 === 0 ? 'exact' : 'deficit';

  dataPoints.push({
    year: 0,
    label: 'Tahun 0',
    totalPortfolio: Math.round(initCap),
    totalPrincipal: Math.round(initCap),
    compoundGain: 0,
    realPortfolio: Math.round(initCap),
    realPrincipal: Math.round(initCap),
    targetFIRE,
    isReached: initCap >= targetFIRE && targetFIRE > 0,
    fireDelta: delta0,
    fireDeltaPercent: Number(deltaPercent0.toFixed(1)),
    fireStatus: status0,
  });

  if (initCap >= targetFIRE && targetFIRE > 0 && yearReached === null) {
    yearReached = 0;
  }

  for (let year = 1; year <= timeHorizonYears; year++) {
    const totalMonths = year * 12;

    // Monthly compounding formula:
    // A_t = P * (1 + r/12)^(12t) + PMT * [((1 + r/12)^(12t) - 1) / (r/12)]
    let totalPortfolio: number;
    if (monthlyRate === 0) {
      totalPortfolio = initCap + monthlyInvestment * totalMonths;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      totalPortfolio =
        initCap * compoundFactor +
        monthlyInvestment * ((compoundFactor - 1) / monthlyRate);
    }

    const totalPrincipal = initCap + monthlyInvestment * totalMonths;
    const compoundGain = Math.max(0, totalPortfolio - totalPrincipal);

    // Real value adjusted for inflation (dikurangi inflasi pertahun)
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const realPortfolio = totalPortfolio / inflationFactor;
    const realPrincipal = totalPrincipal / inflationFactor;

    const roundedPortfolio = Math.round(totalPortfolio);
    const delta = roundedPortfolio - targetFIRE;
    const deltaPercent = targetFIRE > 0 ? (delta / targetFIRE) * 100 : 0;
    const fireStatus: 'surplus' | 'exact' | 'deficit' =
      delta > 0 ? 'surplus' : delta === 0 ? 'exact' : 'deficit';

    const isReached = roundedPortfolio >= targetFIRE;
    if (isReached && yearReached === null) {
      yearReached = year;
    }

    dataPoints.push({
      year,
      label: `Thn ${year}`,
      totalPortfolio: roundedPortfolio,
      totalPrincipal: Math.round(totalPrincipal),
      compoundGain: Math.round(compoundGain),
      realPortfolio: Math.round(realPortfolio),
      realPrincipal: Math.round(realPrincipal),
      targetFIRE,
      isReached,
      fireDelta: delta,
      fireDeltaPercent: Number(deltaPercent.toFixed(1)),
      fireStatus,
    });
  }

  const lastPoint = dataPoints[dataPoints.length - 1];
  const finalPortfolio = lastPoint ? lastPoint.totalPortfolio : 0;
  const finalPrincipal = lastPoint ? lastPoint.totalPrincipal : 0;
  const finalRealPortfolio = lastPoint ? lastPoint.realPortfolio : 0;
  const finalRealPrincipal = lastPoint ? lastPoint.realPrincipal : 0;
  const finalGain = Math.max(0, finalPortfolio - finalPrincipal);
  const gainPercentage = finalPrincipal > 0 ? (finalGain / finalPrincipal) * 100 : 0;

  const finalFireDelta = finalPortfolio - targetFIRE;
  const finalFireDeltaPercent = targetFIRE > 0 ? (finalFireDelta / targetFIRE) * 100 : 0;
  const finalFireStatus: 'surplus' | 'exact' | 'deficit' =
    finalFireDelta > 0 ? 'surplus' : finalFireDelta === 0 ? 'exact' : 'deficit';
  const achievementPercentage = targetFIRE > 0 ? (finalPortfolio / targetFIRE) * 100 : 0;

  // Safe monthly passive income produced by final portfolio (at selected SWR rate)
  const safeMonthlyPassiveIncome = Math.round(finalPortfolio / (12 * swrMultiplier));

  return {
    dataPoints,
    finalPortfolio,
    finalPrincipal,
    finalRealPortfolio,
    finalRealPrincipal,
    finalGain,
    realReturnRate,
    targetFIRE,
    yearReached,
    safeMonthlyPassiveIncome,
    gainPercentage,
    finalFireDelta,
    finalFireDeltaPercent: Number(finalFireDeltaPercent.toFixed(1)),
    finalFireStatus,
    achievementPercentage: Number(achievementPercentage.toFixed(1)),
  };
}

/**
 * Calculate Decumulation & SWR Stress-Test Indonesia (Modul B)
 */
export function calculateDecumulation(params: DecumulationParams): DecumulationResult {
  const {
    initialRetirementBalance,
    firstYearExpense,
    annualPortfolioReturn,
    annualInflationRate,
    retirementYears,
    useAutomaticFirstYearExpense,
  } = params;

  const returnRate = annualPortfolioReturn / 100;
  const inflationRate = annualInflationRate / 100;

  // Year 1 Initial Withdrawals
  // Standard 4.0%
  const initialWithdrawalStd = useAutomaticFirstYearExpense
    ? initialRetirementBalance * 0.04
    : firstYearExpense;

  // Conservative Indonesia 3.25%
  const initialWithdrawalCons = initialRetirementBalance * 0.0325;

  let balanceStd = initialRetirementBalance;
  let balanceCons = initialRetirementBalance;

  let currentWithdrawalStd = initialWithdrawalStd;
  let currentWithdrawalCons = initialWithdrawalCons;

  let standardFailureYear: number | null = null;
  let conservativeFailureYear: number | null = null;

  let totalWithdrawalStd = 0;
  let totalWithdrawalCons = 0;

  const dataPoints: DecumulationDataPoint[] = [];

  // Year 0
  dataPoints.push({
    year: 0,
    label: 'Thn 0',
    balanceStandard: Math.round(balanceStd),
    withdrawalStandard: 0,
    balanceConservative: Math.round(balanceCons),
    withdrawalConservative: 0,
    isStandardDepleted: false,
    isConservativeDepleted: false,
  });

  let lastYearWithdrawalStd = initialWithdrawalStd;
  let lastYearWithdrawalCons = initialWithdrawalCons;

  for (let year = 1; year <= retirementYears; year++) {
    // Determine withdrawal for this year (adjusted for inflation after year 1)
    if (year > 1) {
      currentWithdrawalStd = currentWithdrawalStd * (1 + inflationRate);
      currentWithdrawalCons = currentWithdrawalCons * (1 + inflationRate);
    }

    lastYearWithdrawalStd = currentWithdrawalStd;
    lastYearWithdrawalCons = currentWithdrawalCons;

    // Standard Scenario (4.0%)
    if (balanceStd > 0) {
      const growthStd = balanceStd * (1 + returnRate);
      if (growthStd < currentWithdrawalStd) {
        totalWithdrawalStd += growthStd;
        balanceStd = 0;
        if (standardFailureYear === null) {
          standardFailureYear = year;
        }
      } else {
        totalWithdrawalStd += currentWithdrawalStd;
        balanceStd = growthStd - currentWithdrawalStd;
      }
    } else {
      balanceStd = 0;
      if (standardFailureYear === null) {
        standardFailureYear = year;
      }
    }

    // Conservative Indonesia Scenario (3.25%)
    if (balanceCons > 0) {
      const growthCons = balanceCons * (1 + returnRate);
      if (growthCons < currentWithdrawalCons) {
        totalWithdrawalCons += growthCons;
        balanceCons = 0;
        if (conservativeFailureYear === null) {
          conservativeFailureYear = year;
        }
      } else {
        totalWithdrawalCons += currentWithdrawalCons;
        balanceCons = growthCons - currentWithdrawalCons;
      }
    } else {
      balanceCons = 0;
      if (conservativeFailureYear === null) {
        conservativeFailureYear = year;
      }
    }

    dataPoints.push({
      year,
      label: `Thn ${year}`,
      balanceStandard: Math.round(balanceStd),
      withdrawalStandard: Math.round(currentWithdrawalStd),
      balanceConservative: Math.round(balanceCons),
      withdrawalConservative: Math.round(currentWithdrawalCons),
      isStandardDepleted: balanceStd <= 0,
      isConservativeDepleted: balanceCons <= 0,
    });
  }

  return {
    dataPoints,
    standardFailureYear,
    conservativeFailureYear,
    finalBalanceStandard: Math.round(balanceStd),
    finalBalanceConservative: Math.round(balanceCons),
    totalWithdrawalStandard: Math.round(totalWithdrawalStd),
    totalWithdrawalConservative: Math.round(totalWithdrawalCons),
    firstYearWithdrawalStandard: Math.round(initialWithdrawalStd),
    firstYearWithdrawalConservative: Math.round(initialWithdrawalCons),
    lastYearWithdrawalStandard: Math.round(lastYearWithdrawalStd),
    lastYearWithdrawalConservative: Math.round(lastYearWithdrawalCons),
  };
}
