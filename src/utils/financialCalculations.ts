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
  initialCapital: number;
  monthlyInvestment: number;
  targetMonthlyExpense: number;
  annualReturn: number;
  annualInflation: number;
  timeHorizonYears: number;
  swrMultiplier: number;
}): AccumulationResult {
  const {
    initialCapital,
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
  const targetFIRE = targetMonthlyExpense * 12 * swrMultiplier;

  const dataPoints: AccumulationDataPoint[] = [];
  let yearReached: number | null = null;

  // Year 0 (Starting point)
  dataPoints.push({
    year: 0,
    label: 'Tahun 0',
    totalPortfolio: Math.round(initialCapital),
    totalPrincipal: Math.round(initialCapital),
    compoundGain: 0,
    realPortfolio: Math.round(initialCapital),
    targetFIRE: Math.round(targetFIRE),
    isReached: initialCapital >= targetFIRE,
  });

  if (initialCapital >= targetFIRE && yearReached === null) {
    yearReached = 0;
  }

  for (let year = 1; year <= timeHorizonYears; year++) {
    const totalMonths = year * 12;

    // Monthly compounding formula:
    // A_t = P * (1 + r/12)^(12t) + PMT * [((1 + r/12)^(12t) - 1) / (r/12)]
    let totalPortfolio: number;
    if (monthlyRate === 0) {
      totalPortfolio = initialCapital + monthlyInvestment * totalMonths;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      totalPortfolio =
        initialCapital * compoundFactor +
        monthlyInvestment * ((compoundFactor - 1) / monthlyRate);
    }

    const totalPrincipal = initialCapital + monthlyInvestment * totalMonths;
    const compoundGain = Math.max(0, totalPortfolio - totalPrincipal);

    // Real value adjusted for inflation
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const realPortfolio = totalPortfolio / inflationFactor;

    const isReached = totalPortfolio >= targetFIRE;
    if (isReached && yearReached === null) {
      yearReached = year;
    }

    dataPoints.push({
      year,
      label: `Thn ${year}`,
      totalPortfolio: Math.round(totalPortfolio),
      totalPrincipal: Math.round(totalPrincipal),
      compoundGain: Math.round(compoundGain),
      realPortfolio: Math.round(realPortfolio),
      targetFIRE: Math.round(targetFIRE),
      isReached,
    });
  }

  const lastPoint = dataPoints[dataPoints.length - 1];
  const finalPortfolio = lastPoint ? lastPoint.totalPortfolio : 0;
  const finalPrincipal = lastPoint ? lastPoint.totalPrincipal : 0;
  const finalGain = Math.max(0, finalPortfolio - finalPrincipal);
  const gainPercentage = finalPrincipal > 0 ? (finalGain / finalPrincipal) * 100 : 0;

  // Safe monthly passive income produced by final portfolio (at selected SWR rate)
  const safeMonthlyPassiveIncome = Math.round(finalPortfolio / (12 * swrMultiplier));

  return {
    dataPoints,
    finalPortfolio,
    finalPrincipal,
    finalGain,
    realReturnRate,
    targetFIRE: Math.round(targetFIRE),
    yearReached,
    safeMonthlyPassiveIncome,
    gainPercentage,
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
