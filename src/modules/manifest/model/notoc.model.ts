import { ApiProperty } from '@nestjs/swagger';
import { NotocChanges } from './notoc-delta';
import { CargoDeck } from './hold-layout.model';
import {
  ERC_PATTERN,
  HazardClass,
  HeaviestPiece,
  PackingGroup,
  SpecialHandlingCode,
  TemperatureRegime,
} from './commodity.model';
import { ColdChainRisk } from './cold-chain';

export enum NotocStageName {
  Preliminary = 'preliminary',
  Final = 'final',
}

export const NO_DANGEROUS_GOODS_STATEMENT = 'No dangerous goods loaded.';
export const DANGEROUS_GOODS_STATEMENT =
  'Dangerous goods loaded as listed below.';

export class NotocDrill {
  @ApiProperty({
    description:
      'Emergency response code: a drill number of 1 to 11 followed by one letter per additional risk. Constructed from the published drill chart rather than drawn from a fixed list.',
    pattern: ERC_PATTERN.source,
    example: '3L',
  })
  ercCode!: string;

  @ApiProperty({
    example:
      'Flammable liquid or solid; vapours may form an explosive mixture.',
  })
  inherentRisk!: string;

  @ApiProperty({
    example:
      'Rapid fire spread and dense smoke; heat may weaken structure and burn anyone in reach.',
  })
  riskToAircraftAndOccupants!: string;

  @ApiProperty({
    example:
      'Contain the spill and keep every ignition source away. Fight the fire with water spray, foam, dry chemical or carbon dioxide.',
  })
  spillAndFireProcedure!: string;

  @ApiProperty({
    description: 'Risks the drill letters add on top of the drill number',
    example: ['No significant risk beyond the drill itself.'],
    isArray: true,
    type: String,
  })
  additionalRisks!: string[];
}

export enum RadioactiveCategory {
  IWhite = 'I-WHITE',
  IIYellow = 'II-YELLOW',
  IIIYellow = 'III-YELLOW',
}

export class NotocRadioactive {
  @ApiProperty({
    enum: RadioactiveCategory,
    example: RadioactiveCategory.IIYellow,
  })
  category!: RadioactiveCategory;

  @ApiProperty({
    description:
      'Transport index per package; null for a category I-WHITE package, which carries none',
    example: 0.6,
    nullable: true,
    type: Number,
  })
  transportIndex!: number | null;
}

export class NotocHeader {
  @ApiProperty({ example: 'British Airways' })
  operatorName!: string;

  @ApiProperty({ example: 'BA178' })
  flightNumber!: string;

  @ApiProperty({
    description: 'Scheduled date of the flight, UTC',
    example: '2026-11-23',
  })
  flightDate!: string;

  @ApiProperty({ description: 'Port of loading', example: 'JFK' })
  stationOfLoading!: string;

  @ApiProperty({ example: 'New York' })
  stationOfLoadingCity!: string;

  @ApiProperty({ example: 'G-STBA' })
  aircraftRegistration!: string;

  @ApiProperty({ example: 'B77W' })
  aircraftType!: string;

  @ApiProperty({
    description: 'Who prepared the notification at the station of loading',
    example: 'Megan Ortiz',
  })
  preparedBy!: string;

  @ApiProperty({
    description:
      'Who supervised loading and certifies the positions and that nothing was damaged or leaking',
    example: 'Daniel Kowalski',
  })
  loadingSupervisor!: string;

  @ApiProperty({
    description:
      'Telephone number monitored for the whole flight, from which the dangerous goods information can be obtained. Drawn from a range reserved for fiction, so it reaches no one.',
    example: '+44 20 7946 0412',
  })
  emergencyTelephone!: string;
}

export class NotocDangerousGoods {
  @ApiProperty({
    description:
      'Air waybill; null on a dry ice line, which totals the dry ice in one compartment across waybills',
    example: '020-53729071',
    nullable: true,
    type: String,
  })
  awb!: string | null;

  @ApiProperty({ example: 'Paint' })
  properShippingName!: string;

  @ApiProperty({ example: 'UN1263' })
  unNumber!: string;

  @ApiProperty({ enum: HazardClass, example: HazardClass.FlammableLiquid })
  hazardClass!: HazardClass;

  @ApiProperty({
    description:
      'Class or division as the form prints it: the division and compatibility group for explosives, the class otherwise',
    example: '1.4S',
  })
  classOrDivision!: string;

  @ApiProperty({ enum: HazardClass, nullable: true })
  subsidiaryRisk!: HazardClass | null;

  @ApiProperty({ enum: PackingGroup, nullable: true })
  packingGroup!: PackingGroup | null;

  @ApiProperty({ description: 'Packages declared', example: 24 })
  packages!: number;

  @ApiProperty({ example: '5 L' })
  netPerPackage!: string;

  @ApiProperty({
    description:
      'Whether the quantity is the total for the compartment rather than per package, as on a dry ice line',
    example: false,
  })
  quantityIsTotal!: boolean;

  @ApiProperty({
    description: 'Radioactive package category and transport index',
    nullable: true,
    type: NotocRadioactive,
  })
  radioactive!: NotocRadioactive | null;

  @ApiProperty({
    description:
      'IATA dangerous goods handling code printed in the Code column',
    enum: SpecialHandlingCode,
    example: SpecialHandlingCode.FlammableLiquid,
    nullable: true,
  })
  impCode!: SpecialHandlingCode | null;

  @ApiProperty({
    description:
      'Unit load device the packages are loaded in; null for loose load',
    example: 'AKE 12345 BA',
    nullable: true,
    type: String,
  })
  uldId!: string | null;

  @ApiProperty({
    description:
      'Hold position the load occupies, composed of compartment number, ordinal and side. This is a convention of this system, not a published designation. Null for loose load and for an aircraft whose type carries no curated hold data.',
    example: '12R',
    nullable: true,
    type: String,
  })
  position!: string | null;

  @ApiProperty({ example: 1, nullable: true, type: Number })
  compartment!: number | null;

  @ApiProperty({
    description: 'Airport the load comes off this aircraft at',
    example: 'JFK',
  })
  unloadingAirport!: string;

  @ApiProperty({
    description: 'Whether the load may travel only on a cargo aircraft',
    example: false,
  })
  cargoAircraftOnly!: boolean;

  @ApiProperty({ type: NotocDrill })
  drill!: NotocDrill;
}

export class NotocHeaviestPiece {
  @ApiProperty({ description: 'Weight of the largest piece', example: 620 })
  kg!: number;

  @ApiProperty({ example: 300 })
  lengthCm!: number;

  @ApiProperty({ example: 110 })
  widthCm!: number;

  @ApiProperty({ example: 230 })
  heightCm!: number;
}

export class NotocReposition {
  @ApiProperty({ example: '020-53729071' })
  awb!: string;

  @ApiProperty({
    description: 'Position it held on the preliminary document',
    example: '11L',
    nullable: true,
    type: String,
  })
  from!: string | null;

  @ApiProperty({
    description: 'Position it holds now; null once its unit lost its position',
    example: '21R',
    nullable: true,
    type: String,
  })
  to!: string | null;
}

export class NotocChangeSet {
  @ApiProperty({
    description:
      'Whether anything at all changed since the preliminary document',
    example: true,
  })
  changed!: boolean;

  @ApiProperty({
    description: 'Air waybills of dangerous goods loaded since',
    isArray: true,
    type: String,
  })
  dangerousGoodsAdded!: string[];

  @ApiProperty({
    description: 'Air waybills of dangerous goods offloaded since',
    isArray: true,
    type: String,
  })
  dangerousGoodsRemoved!: string[];

  @ApiProperty({
    description: 'Air waybills of other notifiable loads loaded since',
    isArray: true,
    type: String,
  })
  specialLoadsAdded!: string[];

  @ApiProperty({
    description: 'Air waybills of other notifiable loads offloaded since',
    isArray: true,
    type: String,
  })
  specialLoadsRemoved!: string[];

  @ApiProperty({ type: NotocReposition, isArray: true })
  repositioned!: NotocReposition[];

  @ApiProperty({
    description: 'Change in cargo weight, negative when freight was shed',
    example: -1500,
  })
  cargoChangeKg!: number;

  @ApiProperty({
    description: 'Change in total deadload',
    example: -1500,
  })
  deadloadChangeKg!: number;
}

export enum HoldCondition {
  HeatedAndVentilated = 'HEATED AND VENTILATED HOLD',
  Heated = 'HEATED HOLD',
  Ventilated = 'VENTILATED HOLD',
}

export enum SpecialLoadRemark {
  SecuredStowage = 'SECURED STOWAGE',
  ActiveContainer = 'ACTIVE CONTAINER',
  PackedInDryIce = 'PACKED IN DRY ICE',
}

export class NotocSpecialLoad {
  @ApiProperty({ example: '020-53729071' })
  awb!: string;

  @ApiProperty({ example: 'Live tropical fish, boxed' })
  description!: string;

  @ApiProperty({
    description:
      'Number of packages loaded; null on a notification issued before packages were recorded',
    example: 12,
    nullable: true,
    type: Number,
  })
  pieces!: number | null;

  @ApiProperty({
    description:
      'Supplementary information the form prints for the load, one line each: handling remarks, temperature, hold conditions and the heaviest piece',
    example: ['LIVE FISH IN OXYGENATED BAGS', 'KEEP AT +22 TO +26 °C'],
    isArray: true,
    type: String,
  })
  supplementaryInformation!: string[];

  @ApiProperty({
    description: 'Unit load device the load is in; null for loose load',
    example: 'PMC 41235 BA',
    nullable: true,
    type: String,
  })
  uldId!: string | null;

  @ApiProperty({
    description: 'IATA special handling codes that make the load notifiable',
    enum: SpecialHandlingCode,
    isArray: true,
    example: [SpecialHandlingCode.LiveAnimals],
  })
  shc!: SpecialHandlingCode[];

  @ApiProperty({ example: 640 })
  grossKg!: number;

  @ApiProperty({
    description:
      'Hold position the load occupies, composed of compartment number, ordinal and side. This is a convention of this system, not a published designation. Null for loose load and for an aircraft whose type carries no curated hold data.',
    example: '31L',
    nullable: true,
    type: String,
  })
  position!: string | null;

  @ApiProperty({ example: 3, nullable: true, type: Number })
  compartment!: number | null;

  @ApiProperty({ example: 'JFK' })
  unloadingAirport!: string;

  @ApiProperty({
    description:
      'Weight and dimensions of the largest piece, reported for heavy and outsized loads only',
    nullable: true,
    type: NotocHeaviestPiece,
  })
  heaviestPiece!: HeaviestPiece | null;
}

export class NotocColdChain {
  @ApiProperty({ example: '020-53729071' })
  awb!: string;

  @ApiProperty({ example: 'Vaccines, insulated shipper' })
  description!: string;

  @ApiProperty({ enum: TemperatureRegime })
  regime!: TemperatureRegime;

  @ApiProperty({ enum: ColdChainRisk })
  risk!: ColdChainRisk;

  @ApiProperty({ example: 85.9 })
  marginHours!: number;

  @ApiProperty({
    example: 'An active container with 85.9 h margin on a 100 h endurance.',
  })
  explanation!: string;

  @ApiProperty({
    description:
      'Always true: the assessment informs the captain and gates nothing',
    example: true,
  })
  advisory!: boolean;
}

export class NotocCompartmentLoad {
  @ApiProperty({ example: 1 })
  compartment!: number;

  @ApiProperty({ enum: CargoDeck })
  deck!: CargoDeck;

  @ApiProperty({ example: 6104 })
  weightKg!: number;

  @ApiProperty({ example: 132 })
  dryIceKg!: number;
}

export class NotocLoadSummary {
  @ApiProperty({ type: NotocCompartmentLoad, isArray: true })
  compartments!: NotocCompartmentLoad[];

  @ApiProperty({ description: 'Containers aboard', example: 12 })
  containerCount!: number;

  @ApiProperty({ description: 'Pallets aboard', example: 2 })
  palletCount!: number;

  @ApiProperty({ description: 'Loose lots aboard', example: 1 })
  looseLotCount!: number;

  @ApiProperty({ description: 'Cargo weight, tare included', example: 18000 })
  cargoKg!: number;

  @ApiProperty({ description: 'Baggage weight', example: 2400 })
  baggageKg!: number;

  @ApiProperty({
    description: 'Everything below the floor: cargo, baggage and mail',
    example: 20400,
  })
  deadloadKg!: number;

  @ApiProperty({
    description: 'Shipments continuing beyond this flight',
    example: 3,
  })
  beyondCount!: number;

  @ApiProperty({
    description:
      'Tightest onward connection among them, in minutes; null when nothing continues',
    example: 95,
    nullable: true,
    type: Number,
  })
  tightestConnectionMinutes!: number | null;
}

export class NotocDocument {
  @ApiProperty({
    description:
      'Form header: flight, port of loading, aircraft and the people who prepared and certified it. Null on a notification issued before the header was recorded.',
    nullable: true,
    type: NotocHeader,
  })
  header!: NotocHeader | null;

  @ApiProperty({
    description:
      'Says in as many words whether dangerous goods are aboard, so a clean flight carries a statement rather than an empty document',
    example: NO_DANGEROUS_GOODS_STATEMENT,
  })
  statement!: string;

  @ApiProperty({ type: NotocDangerousGoods, isArray: true })
  dangerousGoods!: NotocDangerousGoods[];

  @ApiProperty({ type: NotocSpecialLoad, isArray: true })
  specialLoads!: NotocSpecialLoad[];

  @ApiProperty({ type: NotocColdChain, isArray: true })
  coldChain!: NotocColdChain[];

  @ApiProperty({ type: NotocLoadSummary })
  summary!: NotocLoadSummary;
}

export class FlightNotoc {
  @ApiProperty({ example: 'c0e83544-cefd-41c8-9c60-aadfaaf08590' })
  flightId!: string;

  @ApiProperty({ enum: NotocStageName })
  stage!: NotocStageName;

  @ApiProperty({ example: '2025-06-02T08:10:00.000Z' })
  issuedAt!: Date;

  @ApiProperty({
    description: 'Pilot who accepted the document; null until they do',
    example: 'fcf6f4bc-290d-43a9-843c-409cd47e143d',
    nullable: true,
    type: String,
  })
  acknowledgedById!: string | null;

  @ApiProperty({
    example: '2025-06-02T08:40:00.000Z',
    nullable: true,
    type: 'string',
  })
  acknowledgedAt!: Date | null;

  @ApiProperty({ type: NotocDocument })
  document!: NotocDocument;

  @ApiProperty({
    description:
      'What changed since the preliminary document; null on the preliminary one itself',
    nullable: true,
    type: NotocChangeSet,
  })
  changes!: NotocChanges | null;
}
