
'use client';

interface BudgetEstimatorProps {
  goal: string;
  audienceSize: number;
  durationDays: number;
  qualityTier: 'low' | 'medium' | 'high';
}

interface ReverseEstimatorProps {
  goal: string;
  audienceSize: number;
  durationDays: number;
  totalBudget: number;
  qualityTier: 'low' | 'medium' | 'high';
}

const goalMapping: { [key: string]: string } = {
    traffic: 'traffic',
    leads: 'leads',
    sales: 'conversions',
    other: 'engagement', 
};

// Base CPR (Cost Per Result) in INR
const baseCPRs: { [key: string]: number } = {
    engagement: 3,
    traffic: 7,
    leads: 20,
    conversions: 50,
};

// Ad quality affects efficiency (CPR). A higher quality ad is more efficient, leading to a lower CPR.
const qualityCprMultiplier = {
    low: 1.2,    // A low quality ad is 20% less efficient (higher CPR)
    medium: 1.0, // Baseline efficiency
    high: 0.85   // A high quality ad is 15% more efficient (lower CPR)
};

const tierActionMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 2.0,
};

export function estimateMetaAdBudget({ goal, audienceSize, durationDays, qualityTier }: BudgetEstimatorProps) {
  const mappedGoal = goalMapping[goal] || 'engagement';
  const safeDuration = durationDays > 0 ? durationDays : 1;

  if (!Object.keys(baseCPRs).includes(mappedGoal)) {
    return { error: "Invalid goal" };
  }

  // 1. Get the baseline CPR and adjust it based on the ad's quality.
  const cpr = baseCPRs[mappedGoal] * qualityCprMultiplier[qualityTier];

  // 2. Estimate target actions based on audience size, capping at 1% or 1000 actions for a medium tier.
  const baseTargetActions = Math.min(Math.floor(audienceSize * 0.01), 1000);

  // 3. Apply the tier multiplier to get the final target actions for the suggestion.
  const expectedActions = Math.ceil(baseTargetActions * tierActionMultiplier[qualityTier]);

  // 4. Calculate budgets.
  const totalBudget = Math.ceil(cpr * expectedActions);
  const dailyBudget = Math.ceil(totalBudget / safeDuration);

  return {
    totalBudget,
    dailyBudget,
    expectedActions,
    cpr: `₹${cpr.toFixed(2)}`,
  };
}


export function reverseEstimateFromBudget({ goal, audienceSize, durationDays, totalBudget, qualityTier }: ReverseEstimatorProps) {
  const mappedGoal = goalMapping[goal] || 'engagement';
  const safeDuration = durationDays > 0 ? durationDays : 1;
  
  if (!Object.keys(baseCPRs).includes(mappedGoal)) {
    return { error: "Invalid goal" };
  }

  // 1. Get the CPR for the current quality tier.
  const cpr = baseCPRs[mappedGoal] * qualityCprMultiplier[qualityTier];

  // 2. Calculate how many actions can be achieved with the given budget.
  const expectedActions = cpr > 0 ? Math.floor(totalBudget / cpr) : 0;
  
  // 3. The CPR remains the same based on quality, but we recalculate the daily budget.
  const dailyBudget = Math.ceil(totalBudget / safeDuration);

  return {
    dailyBudget,
    expectedActions,
    cpr: `₹${cpr.toFixed(2)}`,
  }
}
