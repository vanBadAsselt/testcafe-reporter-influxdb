/**
 * Some feature/risk categories you want to add to your test. If you want other categories, make sure to adjust the setMetadata function as well.
 * @type {{LOGIN: string}}
 */
export interface TestMetadata {
  risk?: Risk;
  feature?: Feature;
}

export enum Risk {
  SMOKE = 'SMOKE',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum Feature {
  LOGIN = 'LOGIN',
  USABILITY = 'USABILITY',
}
