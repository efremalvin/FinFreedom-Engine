import { NextResponse } from 'next/server';

export interface InflationResponse {
  currentRate: number;
  source: string;
  lastUpdatedYear: number;
  historical: Array<{ year: number; rate: number }>;
}

export async function GET() {
  const fallbackData: InflationResponse = {
    currentRate: 2.8,
    source: 'Badan Pusat Statistik (BPS) & Bank Indonesia (Konsensus 2024)',
    lastUpdatedYear: 2024,
    historical: [
      { year: 2024, rate: 2.8 },
      { year: 2023, rate: 2.61 },
      { year: 2022, rate: 5.51 },
      { year: 2021, rate: 1.87 },
      { year: 2020, rate: 1.68 },
      { year: 2019, rate: 2.82 },
    ],
  };

  try {
    const res = await fetch(
      'https://api.worldbank.org/v2/country/IDN/indicator/FP.CPI.TOTL.ZG?format=json&per_page=10',
      {
        next: { revalidate: 86400 }, // Cache 24 hours in Next.js ISR
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!res.ok) {
      return NextResponse.json(fallbackData);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
      return NextResponse.json(fallbackData);
    }

    const series = data[1]
      .filter((item: any) => item && item.value !== null && !isNaN(item.value))
      .map((item: any) => ({
        year: parseInt(item.date, 10),
        rate: Number(parseFloat(item.value).toFixed(2)),
      }));

    if (series.length === 0) {
      return NextResponse.json(fallbackData);
    }

    // Sort descending by year
    series.sort((a: any, b: any) => b.year - a.year);

    const latest = series[0];

    return NextResponse.json({
      currentRate: latest.rate,
      source: `World Bank & BPS Indonesia (${latest.year})`,
      lastUpdatedYear: latest.year,
      historical: series.slice(0, 8),
    });
  } catch {
    return NextResponse.json(fallbackData);
  }
}
