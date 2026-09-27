import { NextResponse } from 'next/server';
import schemes from '../../../data/schemes.json';

type ReasonType = 'pass' | 'warn' | 'fail';

type Reason = {
  text: string;
  type: ReasonType;
};

type Profile = {
  age: number;
  gender: string;
  category: string;
  income: number;
  locationType: string;
  education: string;
  sector: string;
  capitalRequired: number;
  isNewEnterprise?: boolean;
};

type SchemeEligibility = {
  minAge?: number;
  maxAge?: number;

  allowedCategories?: string[];
  specialCategories?: string[];

  allowedSectors?: string[];

  maxIncomeLimit?: Record<string, number | string>;
  maxIncome?: number;
  minIncome?: number;

  requiresNewEnterprise?: boolean;

  minEducation?: Record<string, string>;
};

type Scheme = {
  id: string;
  name: string;
  ministry: string;
  description: string;

  maxLoanLimit?: number;
  minLoanLimit?: number;

  eligibility?: SchemeEligibility;
};

/*
 * ---------------------------------------------------------
 * NORMALIZATION HELPERS
 * ---------------------------------------------------------
 */

const normalize = (value: unknown): string => {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
};

const normalizeCategory = (
  category: string
): string => {
  const value = normalize(category);

  if (
    value === 'female' ||
    value === 'woman' ||
    value === 'women'
  ) {
    return 'women';
  }

  if (
    value === 'sc' ||
    value === 'scheduled caste' ||
    value === 'scheduled castes'
  ) {
    return 'sc';
  }

  if (
    value === 'st' ||
    value === 'scheduled tribe' ||
    value === 'scheduled tribes'
  ) {
    return 'st';
  }

  if (
    value === 'obc' ||
    value === 'other backward class' ||
    value === 'other backward classes'
  ) {
    return 'obc';
  }

  if (
    value === 'ebc' ||
    value === 'economically backward class' ||
    value === 'economically backward classes'
  ) {
    return 'ebc';
  }

  if (
    value === 'ews' ||
    value === 'economically weaker section' ||
    value === 'economically weaker sections'
  ) {
    return 'ews';
  }

  if (
    value === 'dnt' ||
    value === 'denotified' ||
    value === 'de notified' ||
    value === 'de notified tribe'
  ) {
    return 'dnt';
  }

  if (
    value === 'pwd' ||
    value === 'divyang' ||
    value === 'divyangjan' ||
    value === 'person with disability' ||
    value === 'persons with disability' ||
    value === 'differently abled'
  ) {
    return 'pwd';
  }

  if (
    value === 'safai karamchari' ||
    value === 'safai karamcharis'
  ) {
    return 'safai karamchari';
  }

  if (
    value === 'transgender' ||
    value === 'transgender person' ||
    value === 'transgender persons'
  ) {
    return 'transgender';
  }

  if (
    value === 'minority' ||
    value === 'minorities'
  ) {
    return 'minority';
  }

  if (
    value === 'ex servicemen' ||
    value === 'ex serviceman'
  ) {
    return 'ex servicemen';
  }

  if (value === 'general') {
    return 'general';
  }

  return value;
};

const normalizeSector = (
  sector: string
): string => {
  const value = normalize(sector);

  if (
    value === 'agriculture' ||
    value === 'agriculture allied' ||
    value === 'agriculture and allied'
  ) {
    return 'agriculture allied';
  }

  if (
    value === 'food processing' ||
    value === 'food processing enterprise'
  ) {
    return 'food processing';
  }

  if (
    value === 'technology' ||
    value === 'tech'
  ) {
    return 'technology';
  }

  if (
    value === 'artisan' ||
    value === 'artisans' ||
    value === 'craft'
  ) {
    return 'artisan';
  }

  return value;
};

/*
 * ---------------------------------------------------------
 * EDUCATION HELPERS
 * ---------------------------------------------------------
 */

const educationLevel = (
  education: string
): number => {
  const value = normalize(education);

  if (
    value.includes('below 8') ||
    value.includes('below eighth') ||
    value.includes('less than 8')
  ) {
    return 1;
  }

  if (
    value === '8th' ||
    value.includes('8th pass') ||
    value.includes('eighth')
  ) {
    return 2;
  }

  if (
    value === '10th' ||
    value.includes('10th pass') ||
    value.includes('tenth')
  ) {
    return 3;
  }

  if (
    value.includes('12th') ||
    value.includes('twelfth')
  ) {
    return 4;
  }

  if (
    value.includes('graduate') ||
    value.includes('degree') ||
    value.includes('diploma')
  ) {
    return 5;
  }

  return 0;
};

/*
 * ---------------------------------------------------------
 * CATEGORY CHECK
 * ---------------------------------------------------------
 */

const checkCategory = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  const allowedCategories = [
    ...(eligibility.allowedCategories ?? []),
    ...(eligibility.specialCategories ?? []),
  ];

  if (allowedCategories.length === 0) {
    return {
      passed: true,
      applicable: false,
      reason:
        'No specific category restriction is listed.',
    };
  }

  const profileCategory =
    normalizeCategory(profile.category);

  const profileGender =
    normalize(profile.gender);

  const categoryMatch =
    allowedCategories.some((category) => {
      const normalizedCategory =
        normalizeCategory(category);

      if (
        normalizedCategory ===
        profileCategory
      ) {
        return true;
      }

      if (
        normalizedCategory === 'women' &&
        profileGender === 'female'
      ) {
        return true;
      }

      return false;
    });

  if (categoryMatch) {
    return {
      passed: true,
      applicable: true,
      reason:
        `Your category (${profile.category}) is covered by this scheme.`,
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      `This scheme is restricted to ${allowedCategories.join(
        ', '
      )}.`,
  };
};

/*
 * ---------------------------------------------------------
 * AGE CHECK
 * ---------------------------------------------------------
 */

const checkAge = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  const minAge =
    eligibility.minAge;

  const maxAge =
    eligibility.maxAge;

  if (
    minAge === undefined &&
    maxAge === undefined
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'No specific age restriction is listed.',
    };
  }

  const minimum =
    minAge !== undefined
      ? minAge
      : 0;

  const maximum =
    maxAge !== undefined
      ? maxAge
      : 200;

  const passed =
    profile.age >= minimum &&
    profile.age <= maximum;

  if (passed) {
    return {
      passed: true,
      applicable: true,
      reason:
        `Your age (${profile.age}) is within the allowed range of ${minimum}-${maximum} years.`,
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      `Your age (${profile.age}) is outside the allowed range of ${minimum}-${maximum} years.`,
  };
};

/*
 * ---------------------------------------------------------
 * INCOME CHECK
 * ---------------------------------------------------------
 */

const checkIncome = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  /*
   * Supports the older dataset format:
   * maxIncomeLimit: {
   *   OBC: 300000
   * }
   */

  const limits =
    eligibility.maxIncomeLimit;

  if (limits) {
    const category =
      normalizeCategory(
        profile.category
      );

    let limit:
      | number
      | string
      | undefined;

    for (
      const [key, value] of Object.entries(
        limits
      )
    ) {
      if (
        normalizeCategory(key) ===
        category
      ) {
        limit = value;
        break;
      }
    }

    if (limit !== undefined) {
      if (
        typeof limit === 'string' &&
        normalize(limit).includes(
          'no income limit'
        )
      ) {
        return {
          passed: true,
          applicable: true,
          reason:
            'There is no income limit listed for your category.',
        };
      }

      if (
        typeof limit === 'number'
      ) {
        if (
          profile.income <= limit
        ) {
          return {
            passed: true,
            applicable: true,
            reason:
              `Your annual family income (${formatCurrency(
                profile.income
              )}) is within the ${formatCurrency(
                limit
              )} limit.`,
          };
        }

        return {
          passed: false,
          applicable: true,
          reason:
            `Your annual family income (${formatCurrency(
              profile.income
            )}) exceeds the ${formatCurrency(
              limit
            )} limit.`,
        };
      }
    }
  }

  /*
   * Supports the newer simple format:
   * maxIncome: 300000
   */

  if (
    typeof eligibility.maxIncome ===
    'number'
  ) {
    const limit =
      eligibility.maxIncome;

    if (
      profile.income <= limit
    ) {
      return {
        passed: true,
        applicable: true,
        reason:
          `Your annual family income (${formatCurrency(
            profile.income
          )}) is within the ${formatCurrency(
            limit
          )} maximum income limit.`,
      };
    }

    return {
      passed: false,
      applicable: true,
      reason:
        `Your annual family income (${formatCurrency(
          profile.income
        )}) exceeds the ${formatCurrency(
          limit
        )} maximum income limit.`,
    };
  }

  /*
   * Supports an optional minimum income.
   */

  if (
    typeof eligibility.minIncome ===
    'number'
  ) {
    const minimum =
      eligibility.minIncome;

    if (
      profile.income >= minimum
    ) {
      return {
        passed: true,
        applicable: true,
        reason:
          `Your annual family income meets the minimum requirement of ${formatCurrency(
            minimum
          )}.`,
      };
    }

    return {
      passed: false,
      applicable: true,
      reason:
        `Your annual family income is below the minimum requirement of ${formatCurrency(
          minimum
        )}.`,
    };
  }

  return {
    passed: true,
    applicable: false,
    reason:
      'No income ceiling is listed for this scheme.',
  };
};

/*
 * ---------------------------------------------------------
 * LOCATION CHECK
 * ---------------------------------------------------------
 *
 * Location is currently informational because the
 * current JSON dataset does not contain rural/urban
 * eligibility rules for individual schemes.
 */

const checkLocation = (
  profile: Profile
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  return {
    passed: true,
    applicable: false,
    reason:
      `Your selected location is ${profile.locationType}.`,
  };
};

/*
 * ---------------------------------------------------------
 * SECTOR CHECK
 * ---------------------------------------------------------
 */

const checkSector = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  const allowedSectors =
    eligibility.allowedSectors ?? [];

  if (
    allowedSectors.length === 0
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'No specific sector restriction is listed.',
    };
  }

  const normalizedProfileSector =
    normalizeSector(
      profile.sector
    );

  const sectorMatch =
    allowedSectors.some(
      (sector) => {
        const normalizedSector =
          normalizeSector(
            sector
          );

        return (
          normalizedSector ===
            'all sectors' ||
          normalizedSector ===
            normalizedProfileSector
        );
      }
    );

  if (sectorMatch) {
    return {
      passed: true,
      applicable: true,
      reason:
        `Your business sector (${profile.sector}) is supported by this scheme.`,
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      `Your business sector (${profile.sector}) is not listed. Supported sectors: ${allowedSectors.join(
        ', '
      )}.`,
  };
};

/*
 * ---------------------------------------------------------
 * CAPITAL / LOAN AMOUNT CHECK
 * ---------------------------------------------------------
 */

const checkCapital = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const maxLoanLimit =
    scheme.maxLoanLimit;

  const minLoanLimit =
    scheme.minLoanLimit;

  if (
    maxLoanLimit === undefined ||
    maxLoanLimit === 0
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'This scheme does not specify a maximum loan amount in the current dataset.',
    };
  }

  if (
    minLoanLimit !== undefined &&
    profile.capitalRequired <
      minLoanLimit
  ) {
    return {
      passed: false,
      applicable: true,
      reason:
        `Your required capital (${formatCurrency(
          profile.capitalRequired
        )}) is below the minimum scheme amount of ${formatCurrency(
          minLoanLimit
        )}.`,
    };
  }

  if (
    profile.capitalRequired <=
    maxLoanLimit
  ) {
    return {
      passed: true,
      applicable: true,
      reason:
        `Your required capital (${formatCurrency(
          profile.capitalRequired
        )}) is within the scheme limit of ${formatCurrency(
          maxLoanLimit
        )}.`,
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      `Your required capital (${formatCurrency(
        profile.capitalRequired
      )}) exceeds the scheme limit of ${formatCurrency(
        maxLoanLimit
      )}.`,
  };
};

/*
 * ---------------------------------------------------------
 * NEW ENTERPRISE CHECK
 * ---------------------------------------------------------
 */

const checkEnterpriseStage = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  if (
    eligibility.requiresNewEnterprise !==
    true
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'This scheme does not specify a new-enterprise requirement.',
    };
  }

  if (
    profile.isNewEnterprise ===
    true
  ) {
    return {
      passed: true,
      applicable: true,
      reason:
        'You selected a new enterprise, which matches this scheme requirement.',
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      'This scheme is intended for a new enterprise, but your profile is not marked as a new enterprise.',
  };
};

/*
 * ---------------------------------------------------------
 * EDUCATION CHECK
 * ---------------------------------------------------------
 */

const checkEducation = (
  profile: Profile,
  scheme: Scheme
): {
  passed: boolean;
  applicable: boolean;
  reason: string;
} => {
  const eligibility =
    scheme.eligibility ?? {};

  const educationRules =
    eligibility.minEducation;

  if (!educationRules) {
    return {
      passed: true,
      applicable: false,
      reason:
        'No specific education requirement is listed.',
    };
  }

  const category =
    normalizeCategory(
      profile.category
    );

  let requiredEducation:
    | string
    | undefined;

  for (
    const [key, value] of Object.entries(
      educationRules
    )
  ) {
    if (
      normalizeCategory(key) ===
      category
    ) {
      requiredEducation = value;
      break;
    }
  }

  if (
    requiredEducation === undefined
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'No specific education requirement is listed for your category.',
    };
  }

  const userLevel =
    educationLevel(
      profile.education
    );

  const requiredLevel =
    educationLevel(
      requiredEducation
    );

  if (
    userLevel === 0 ||
    requiredLevel === 0
  ) {
    return {
      passed: true,
      applicable: false,
      reason:
        'Education eligibility could not be fully evaluated from the available scheme data.',
    };
  }

  if (
    userLevel >= requiredLevel
  ) {
    return {
      passed: true,
      applicable: true,
      reason:
        `Your education level (${profile.education}) meets the minimum requirement of ${requiredEducation}.`,
    };
  }

  return {
    passed: false,
    applicable: true,
    reason:
      `Your education level (${profile.education}) does not meet the minimum requirement of ${requiredEducation}.`,
  };
};

/*
 * ---------------------------------------------------------
 * CURRENCY FORMATTER
 * ---------------------------------------------------------
 */

const formatCurrency = (
  amount: number
): string => {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }
  ).format(amount);
};

/*
 * ---------------------------------------------------------
 * MATCH SCORE
 * ---------------------------------------------------------
 *
 * Only eligibility checks that actually apply to a
 * scheme are included in the percentage.
 *
 * Informational checks do not reduce the score.
 */

const calculateScore = (
  checks: {
    passed: boolean;
    applicable: boolean;
    reason: string;
  }[]
): number => {
  const applicableChecks =
    checks.filter(
      (check) => check.applicable
    );

  if (
    applicableChecks.length === 0
  ) {
    return 100;
  }

  const passedChecks =
    applicableChecks.filter(
      (check) => check.passed
    );

  return Math.round(
    (passedChecks.length /
      applicableChecks.length) *
      100
  );
};

/*
 * ---------------------------------------------------------
 * POST /api/match
 * ---------------------------------------------------------
 */

export async function POST(
  request: Request
) {
  try {
    const profile =
      (await request.json()) as Profile;

    const safeProfile: Profile = {
      age:
        Number(profile?.age) || 0,

      gender:
        String(
          profile?.gender ?? ''
        ),

      category:
        String(
          profile?.category ?? ''
        ),

      income:
        Number(profile?.income) || 0,

      locationType:
        String(
          profile?.locationType ?? ''
        ),

      education:
        String(
          profile?.education ?? ''
        ),

      sector:
        String(
          profile?.sector ?? ''
        ),

      capitalRequired:
        Number(
          profile?.capitalRequired
        ) || 0,

      isNewEnterprise:
        Boolean(
          profile?.isNewEnterprise
        ),
    };

    /*
     * The JSON dataset contains fields that are
     * optional depending on the scheme.
     */
    const typedSchemes =
      schemes as unknown as Scheme[];

    const results =
      typedSchemes.map(
        (scheme) => {
          const categoryCheck =
            checkCategory(
              safeProfile,
              scheme
            );

          const ageCheck =
            checkAge(
              safeProfile,
              scheme
            );

          const incomeCheck =
            checkIncome(
              safeProfile,
              scheme
            );

          const locationCheck =
            checkLocation(
              safeProfile
            );

          const sectorCheck =
            checkSector(
              safeProfile,
              scheme
            );

          const capitalCheck =
            checkCapital(
              safeProfile,
              scheme
            );

          const enterpriseCheck =
            checkEnterpriseStage(
              safeProfile,
              scheme
            );

          const educationCheck =
            checkEducation(
              safeProfile,
              scheme
            );

          const checks = [
            categoryCheck,
            ageCheck,
            incomeCheck,
            locationCheck,
            sectorCheck,
            capitalCheck,
            enterpriseCheck,
            educationCheck,
          ];

          const matchPercentage =
            calculateScore(
              checks
            );

          const reasons: Reason[] =
            checks.map(
              (check) => ({
                text:
                  check.reason,

                type:
                  check.applicable
                    ? check.passed
                      ? 'pass'
                      : 'fail'
                    : 'warn',
              })
            );

          return {
            id: scheme.id,

            name:
              scheme.name,

            ministry:
              scheme.ministry,

            description:
              scheme.description,

            maxLoanLimit:
              scheme.maxLoanLimit,

            matchPercentage,

            reasons,
          };
        }
      );

    /*
     * Highest matching schemes first.
     */
    results.sort(
      (a, b) =>
        b.matchPercentage -
        a.matchPercentage
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error(
      'Match API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Invalid profile data payload',
      },
      {
        status: 400,
      }
    );
  }
}