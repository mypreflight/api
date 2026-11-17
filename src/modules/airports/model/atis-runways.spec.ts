import { readAtisRunways } from './atis-runways';
import { WeatherInformationType } from './airport-weather.model';

const { Atis, AtisArrival, AtisDeparture } = WeatherInformationType;

const BOSTON = [
  '04L',
  '04R',
  '09',
  '14',
  '15L',
  '15R',
  '22L',
  '22R',
  '27',
  '32',
  '33L',
  '33R',
];
const KENNEDY = ['04L', '04R', '13L', '13R', '22L', '22R', '31L', '31R'];
const ATLANTA = [
  '08L',
  '08R',
  '09L',
  '09R',
  '10',
  '26L',
  '26R',
  '27L',
  '27R',
  '28',
];
const DALLAS = [
  '13L',
  '13R',
  '17C',
  '17L',
  '17R',
  '18L',
  '18R',
  '31L',
  '31R',
  '35C',
  '35L',
  '35R',
  '36L',
  '36R',
];
const PHILADELPHIA = ['08', '09L', '09R', '17', '26', '27L', '27R', '35'];
const FRANKFURT = ['07C', '07L', '07R', '18', '25C', '25L', '25R'];
const WARSAW = ['11', '15', '29', '33'];
const HEATHROW = ['09L', '09R', '27L', '27R'];
const ABU_DHABI = ['13L', '13R', '31L', '31R'];
const RIYADH = ['15L', '15R', '33L', '33R'];
const HO_CHI_MINH = ['07L', '07R', '25L', '25R'];
const SCHIPHOL = [
  '04',
  '06',
  '09',
  '18C',
  '18L',
  '18R',
  '22',
  '24',
  '27',
  '36C',
  '36L',
  '36R',
];
const MACTAN = ['04L', '04R', '22L', '22R'];
const DOHA = ['16L', '16R', '34L', '34R'];
const COPENHAGEN = ['04L', '04R', '12', '22L', '22R', '30'];
const BARCELONA = ['02', '06L', '06R', '20', '24L', '24R'];
const BELFAST = ['07', '17', '25', '35'];
const TAIPEI_SONGSHAN = ['10', '28'];
const AVALON = ['18', '36'];

describe('readAtisRunways', () => {
  it.each([
    {
      name: 'an FAA ATIS naming the approach and the departure runway',
      content:
        'BOS ATIS INFO C 1554Z. 32005KT 10SM FEW050 09/M01 A3031 (THREE ZERO THREE ONE). RNAV Z 33L, DEP 27. RY 33L ILS OTS. READBACK ALL HOLD SHORT INSTRCNS AND ASSIGNED ALTITUDES. ...ADVS YOU HAVE INFO C.',
      type: Atis,
      designators: BOSTON,
      arrival: ['33L'],
      departure: ['27'],
    },
    {
      name: 'an FAA ATIS that closes other runways after naming the one in use',
      content:
        'JFK ATIS INFO C 0951Z. 33005KT 10SM FEW250 04/01 A3049 (THREE ZERO FOUR NINER). APPROACH IN USE ILS RY 31L. DEPG RY 31L. RWY 4L, 22R CLSD, RWY 13L, 31R CLSD. TWY MB TURNOFF CLSD. RY 31L PAPI OTS. NUM CRANES OPERATING AT JFK. BIRD ACTIVITY VICINITY ARPT. READBACK ALL RWY ASSIGNMENTS AND HOLD SHORT INSTRUCTIONS. ...ADVS YOU HAVE INFO C.',
      type: Atis,
      designators: KENNEDY,
      arrival: ['31L'],
      departure: ['31L'],
    },
    {
      name: 'an FAA arrival ATIS naming visual approaches without the word runway',
      content:
        'ATL ARR INFO A 1552Z. 09010KT 10SM FEW150 SCT200 SCT250 11/01 A3047 (THREE ZERO FOUR SEVEN). SIMULTANEOUS APCHS IN USE VIS 8L, VIS 9R, VIS 10. ...ADVS YOU HAVE INFO A.',
      type: AtisArrival,
      designators: ATLANTA,
      arrival: ['08L', '09R', '10'],
      departure: [],
    },
    {
      name: 'an FAA departure ATIS listing runways after a comma',
      content:
        'PHL DEP INFO U 1554Z. 36010KT 10SM FEW032 SCT250 11/02 A3043 (THREE ZERO FOUR THREE). DEPG 27L, RWY 35. ...ADVS YOU HAVE INFO U.',
      type: AtisDeparture,
      designators: PHILADELPHIA,
      arrival: [],
      departure: ['27L', '35'],
    },
    {
      name: 'a departure ATIS whose NOTAMs mention other runways',
      content:
        'KDFW DEPARTURE INFO H 0853Z. 00000KT 10SM CLR 07/03 A3036 (THREE ZERO THREE SIX). SIMUL PARL TRAFFIC DEPG RWYS 36L, 35L. NOTAMS... RWY 36R CLSD. EXP INT DEP RWY 36L AT TWY B. ASDE-X IN USE. ...ADVS YOU HAVE INFO H',
      type: AtisDeparture,
      designators: DALLAS,
      arrival: [],
      departure: ['36L', '35L'],
    },
    {
      name: 'an arrival ATIS listing four ILS runways and land-and-hold-short',
      content:
        'KDFW ARRIVAL INFO Y 0853Z. 00000KT 10SM CLR 07/03 A3036 (THREE ZERO THREE SIX). SIMUL APCH IN USE. EXPECT ILS TO RWYS, 36L, 35C, 35R, 31R. LDG RWY 35C EXP LAHSO TWY EJ 9050 FT AVL, LDG RWY 36L EXP LAHSO TWY Z 10650 FT AVL. NOTAMS... RWY 36R CLSD. BIRD ACTIVITY VCNTY ARPT. ...ADVS YOU HAVE INFO Y',
      type: AtisArrival,
      designators: DALLAS,
      arrival: ['36L', '35C', '35R', '31R'],
      departure: [],
    },
    {
      name: 'a VATSIM arrival ATIS warning not to mistake a taxiway for another runway',
      content:
        'ARR-ATIS EDDF A METAR 170920\nEXPECT DEPENDENT PARALLEL ILS Y APCH RWY 25R OR ILS APCH RWY 25L\nRWY 25R 25L\nDO NOT MISTAKE TWY M FOR RWY 25C WHEN PERFORMING VISUAL APPROACH\nTRL 70\nVRB02KT 6000 2300 OVC004 RA BR T09 DP09 QNH989\nTREND TEMPO 4000',
      type: AtisArrival,
      designators: FRANKFURT,
      arrival: ['25R', '25L'],
      departure: [],
    },
    {
      name: 'a departure ATIS naming two runways without punctuation',
      content:
        'EDDF DEP ATIS M\n1150Z -DEP-ATIS EDDF M METAR 081150\n\t-RWY 25C 18\n\t-TRL 70\n\t-QNH1018',
      type: AtisDeparture,
      designators: FRANKFURT,
      arrival: [],
      departure: ['25C', '18'],
    },
    {
      name: 'a departure ATIS saying delivery is closed',
      content:
        'EGLL DEP ATIS O 0920Z DEPARTURE RWY 27L DELIVERY IS CLOSED, FOR START CLEARANCE CONTACT GROUND ON 121.705. 25021KT 9999 SCT021 BKN026 BKN038 13/10 Q980 NOSIG',
      type: AtisDeparture,
      designators: HEATHROW,
      arrival: [],
      departure: ['27L'],
    },
    {
      name: 'an arrival ATIS naming the landing runway twice',
      content:
        'EGLL ARR ATIS C 0920Z LANDING RWY 27R TRANSITION-LEVEL FL 80 A388 AIRCRAFT LANDING ON RUNWAY 27R MUST VACATE AT A10E OR LATER. 25021KT 9999 SCT021 BKN026 BKN038 13/10 Q980 NOSIG',
      type: AtisArrival,
      designators: HEATHROW,
      arrival: ['27R'],
      departure: [],
    },
    {
      name: 'an ATIS using both runways both ways',
      content:
        'OMAA DEP ARR D 0930Z DEP 31L AND 31R. ILS APP / LDG 31L AND 31R. PARALLEL OPERATIONS IN PROGRESS. PRIMARY DEPARTURE RWY IS 31L. PRIMARY ARRIVAL RWY IS 31R. WIND 27006KT 200V310 VIS 10KM T 30 / D 14 QNH 1013',
      type: Atis,
      designators: ABU_DHABI,
      arrival: ['31L', '31R'],
      departure: ['31L', '31R'],
    },
    {
      name: 'an ATIS spelling out the side and saying what each runway is for after it',
      content:
        'OERK ATIS DELTA  0900Z EXPECT ILS DME RWY33L. TRL FL150 / RWY 33 LEFT FOR ARRIVALS. RWY 33 RIGHT FOR DEP. ARRIVALS RWY 33 LEFT SHALL PLAN TO EXIT VIA A4.',
      type: Atis,
      designators: RIYADH,
      arrival: ['33L'],
      departure: ['33R'],
    },
    {
      name: 'an ATIS telling arrivals to hold short of the departure runway',
      content:
        'TAN SON NHAT ATIS INFORMATION XRAY .. REPORT AT 0930 UTC .. DEPARTURE RUNWAY 25L .. ARRIVAL ILS WHISKEY RUNWAY 25R .. WIND 140 DEGREES 8 KNOTS .. AFTER LANDING, VACATE VIA PAPA 4, PAPA 5 OR PAPA 6 AND HOLD SHORT OF RUNWAY 25L.',
      type: Atis,
      designators: HO_CHI_MINH,
      arrival: ['25R'],
      departure: ['25L'],
    },
    {
      name: 'a departure ATIS also naming the main landing runway',
      content:
        'THIS IS SCHIPHOL DEPARTURE INFORMATION Q .. MAIN DEPARTURE RUNWAY 09 .. MAIN LANDING RUNWAY 06 .. WIND 100 DEGREES .. 14 KNOTS .. VISIBILITY 2300',
      type: AtisDeparture,
      designators: SCHIPHOL,
      arrival: ['06'],
      departure: ['09'],
    },
    {
      name: 'an ATIS giving the runway in use after the approach',
      content:
        'THIS IS MACTAN-CEBU INTERNATIONAL AIRPORT INFORMATION B. TIME 0900Z.EXP RNP RWY 04R. RWY 04R IN USE. 04008KT VIS 10KM FEW015 30/25 QNH 1011',
      type: Atis,
      designators: MACTAN,
      arrival: ['04R'],
      departure: ['04R'],
    },
    {
      name: 'a departure ATIS whose runway in use is for departures',
      content:
        '0900Z OTHH DEP ATIS T. RWY IN USE 34 LEFT. DEPARTURES RWY 34 L , EXP LUSAIL 1, AS PER NOTAM A 1080 / 26. RWY 34 R UNAVAILABLE. WIND RWY 34L 360 DEG',
      type: AtisDeparture,
      designators: DOHA,
      arrival: [],
      departure: ['34L'],
    },
    {
      name: 'an arrival ATIS with the runway condition report',
      content:
        'EKCH ARR ATIS B 0920Z EXPECT ILS APP RWY IN USE 22L RUNWAY 22L CONDITION REPORT AT 0920Z RUNWAY CONDITION CODES 6, 6, 6, ALL PARTS 100 PERCENT DRY TRL 70 AFTER LANDING EXPEDITE VACATING RWY WIND 260 8 KT VIS 10KM',
      type: AtisArrival,
      designators: COPENHAGEN,
      arrival: ['22L'],
      departure: [],
    },
    {
      name: 'an ATIS naming the runway for arrivals and for departures in one sentence',
      content:
        'LEBL ATIS ARR A 0930Z EXPECT ILS Z APCH. RWY IN USE FOR ARR 24L AND FOR DEP 24L. TRL75 R-NAV APCH TRANSITIONS IN USE FROM INITIAL APPROACH FIX. EXPECT 2L APCH TRANSITIONS FOR RUNWAY 24L. WIND 220 DEG 07 KT',
      type: AtisArrival,
      designators: BARCELONA,
      arrival: ['24L'],
      departure: ['24L'],
    },
    {
      name: 'an ATIS whose one runway in use serves both',
      content:
        'EGAA COM ATIS A. 0920Z. RWY IN USE 07. TRANSITION-LEVEL FL 85. ARRIVING AIRCRAFT EXPECT AN RNP OR VOR APPROACH TO RUNWAY 07. DEPARTING AIRCRAFT MAKE INITIAL CONTACT WITH SCOTTISH CONTROL 132.730.',
      type: Atis,
      designators: BELFAST,
      arrival: ['07'],
      departure: ['07'],
    },
    {
      name: 'a spoken SayIntentions ATIS',
      content:
        'Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80.',
      type: Atis,
      designators: WARSAW,
      arrival: ['11'],
      departure: ['15'],
    },
    {
      name: 'a spoken ATIS saying the side of the runway in words',
      content:
        'Logan airport, information Delta. 1054 Zulu. ILS runway 4 right approach in use. Departing runway 9. Wind 210 at 9. Visibility 10. Few 4000.',
      type: Atis,
      designators: BOSTON,
      arrival: ['04R'],
      departure: ['09'],
    },
    {
      name: 'an ATIS naming no runway',
      content:
        'ATIS YMAV Z 170934 AVALON TOWER CLOSED. ADVISORY FREQUENCY 120.1. IFR AIRCRAFT ONLY, MUST CONTACT MELBOURNE APPROACH 132.0. AVALON TERMINAL INFORMATION ZULU',
      type: Atis,
      designators: AVALON,
      arrival: [],
      departure: [],
    },
  ])('reads $name', ({ content, type, designators, arrival, departure }) => {
    expect(readAtisRunways(content, type, designators)).toEqual({
      arrival,
      departure,
      settled: true,
    });
  });

  it('leaves a runway that the ATIS does not say the use of unsettled', () => {
    const reading = readAtisRunways(
      'RCSS INFORMATION FOR ARR AND DEP A. 0900Z. EXP ILS APCH. OPS AND INFO, RWY 10. 10007KT 9999 FEW020',
      Atis,
      TAIPEI_SONGSHAN,
    );

    expect(reading.settled).toBe(false);
  });

  it('leaves a runway the airport does not have unsettled', () => {
    const reading = readAtisRunways(
      'BOS ATIS INFO E 1154Z. ILS RY 4R APCH IN USE. DEPG RY 9.',
      Atis,
      ['04L', '09', '27'],
    );

    expect(reading).toEqual({ arrival: [], departure: ['09'], settled: false });
  });

  it('leaves runways spelled out in words unsettled', () => {
    const reading = readAtisRunways(
      'Logan airport, information Delta. ILS runway four right approach in use. Departing runway niner.',
      Atis,
      BOSTON,
    );

    expect(reading).toEqual({ arrival: [], departure: [], settled: false });
  });

  it('settles an ATIS of an airport without runways on nothing', () => {
    expect(
      readAtisRunways('BOS ATIS INFO E. ILS RY 4R APCH IN USE.', Atis, []),
    ).toEqual({ arrival: [], departure: [], settled: true });
  });
});
