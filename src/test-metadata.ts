/**
 * Some feature/risk categories you want to add to your test. If you want other categories, make sure to adjust the setMetadata function as well.
 * @type {{LOGIN: string}}
 */
// export interface TestMetadata {
//   risk?: Risk;
//   feature?: Feature;
// }
//
// export enum Risk {
//   SMOKE = 'SMOKE',
//   HIGH = 'HIGH',
//   MEDIUM = 'MEDIUM',
//   LOW = 'LOW',
// }
//
// export enum Feature {
//   LOGIN = 'LOGIN',
//   USABILITY = 'USABILITY',
// }
export interface TestMetadata {
  category?: Category;
  process?: Process;
  section?: Section;
}

export enum Category {
  SMOKE = 'SMOKE',
}

export enum Process {
  TOEZICHT_HANDHAVING = 'TOEZICHT_HANDHAVING',
  PLANNING_VERKEER = 'PLANNING_VERKEER',
}

export enum Section {
  PA_AANVRAGEN = 'PA_AANVRAGEN',
  PA_BEZOEK = 'PA_BEZOEK',
  PA_MDOH = 'PA_MDOH',
  PA_MELDINGEN = 'PA_MELDINGEN',
  PA_PORTOLANO = 'PA_PORTOLANO',
  PA_VERKEER = 'PA_VERKEER',
  PA_STOFFEN = 'PA_STOFFEN',
  PV_BEZOEKDOSSIER = 'PV_BEZOEKDOSSIER',
}
