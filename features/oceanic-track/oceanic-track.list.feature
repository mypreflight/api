Feature: Read the oceanic tracks published now

  Scenario: As anyone I can read today's North Atlantic and Pacific tracks with every fix placed
    When I send a "GET" request to "/api/v1/oceanic-track"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "fetchedAt": "@date('in the past')",
        "tracks": [
          {
            "system": "nat",
            "identifier": "S",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "NICSO 48/50 50/40 52/30 54/20 DOGAL BEXET",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "T",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "PORTI 47/50 49/40 51/30 53/20 MALOT GISTI",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "U",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "RELIC 4630/50 4830/40 5030/30 5230/20 TOBOR RILED",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": ["RELIC"],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "V",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "SUPRY 46/50 48/40 50/30 52/20 LIMRI XETBO",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "W",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "RAFIN 45/50 47/40 49/30 51/20 DINIM ELSOX",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "X",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "DOVEY 42/60 44/50 46/40 48/30 50/20 SOMAX ATSUR",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "Y",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "JOBOC 41/60 42/50 42/40",
            "levels": [350, 370],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "Z",
            "direction": "east",
            "issuingAuthority": "CZQX",
            "notamNumber": "CZQX1113/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "SOORY 43/50 45/40 47/30 49/20 BEDRA NASBA",
            "levels": [360, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": ["NASBA"],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "A",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "DOGAL 55/20 56/30 56/40 55/50 LOMSI",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": [
              { "ident": "DOGAL", "latitude": 54, "longitude": -15 },
              { "ident": "55/20", "latitude": 55, "longitude": -20 },
              { "ident": "56/30", "latitude": 56, "longitude": -30 },
              { "ident": "56/40", "latitude": 56, "longitude": -40 },
              { "ident": "55/50", "latitude": 55, "longitude": -50 },
              { "ident": "LOMSI", "latitude": 53.1, "longitude": -56.783333 }
            ],
            "unresolvedFixes": [],
            "remarks": "1. TMI IS 316.\n2. SEND RCL 90 TO 30 MINUTES PRIOR TO OCEANIC ENTRY POINT. INCLUDE MAX LEVEL IN RCL.\n3. PBCS OTS LEVELS 340 TO 400. PBCS TRACKS AS FOLLOWS TRACK A TRACK B TRACK C TRACK D TRACK E TRACK F TRACK G END OF PBCS OTS.\n4. SLOP SHOULD BE USED IN NAT AIRSPACE. LEFT SLOP PROHIBITED.\n5. 10 MINUTES AFTER PASSING OEP SQUAWK 2000 UNLESS OTHERWISE INSTRUCTED.\n6. ADS C AND CPDLC ARE MANDATED FOR LEVELS 290 TO 410 IN NAT AIRSPACE.\n7. UK AIP ENR 2.2 PARA 3.5.2 STATES THAT NAT OPERATORS SHALL FILE PRM'S.\n8. OPERATORS ARE REMINDED TO ONLY USE NAT TRACK DESIGNATORS IN FLIGHT PLANS WHEN FLYING THE WHOLE LENGTH OF THE NAT TRACK.\n9. DATA LINK EQUIPPED FLIGHTS NOT LOGGED ONTO DOMESTIC AIRSPACE PRIOR TO ENTERING THE SHANWICK OCA MUST INITIATE A LOGON TO EGGX 10 TO 25 MINS PRIOR TO OCA ENTRY.\n10. EGGX HAS DELAYED IMPLENTATION OF OCR UNTIL FURTHER NOTICE.\n11. NOTIFY ANY GNSS INTERFERENCE IN RCL CONFIRMING RNP CAPABILITY.",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "B",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "NEBIN 5430/20 5530/30 5530/40 5430/50 MELDI",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": ["MELDI"],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "C",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "MALOT 54/20 55/30 55/40 54/50 NEEKO",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "D",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "TOBOR 5330/20 5430/30 5430/40 5330/50 PELTU",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": ["PELTU"],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "E",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "LIMRI 53/20 54/30 54/40 53/50 RIKAL",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "F",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "ADARA 5230/20 5330/30 5330/40 5230/50 SAXAN",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": ["SAXAN"],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "nat",
            "identifier": "G",
            "direction": "west",
            "issuingAuthority": "EGGX",
            "notamNumber": "EGGX1112/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "DINIM 52/20 53/30 53/40 52/50 TUDEP",
            "levels": [340, 350, 360, 370, 380, 390, 400],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "@any",
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "A",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5313/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "PUPPI CRESP 23N170W 25N180E 27N170E 28N160E 31N150E TONIK",
            "levels": [],
            "fixes": [
              {
                "ident": "PUPPI",
                "latitude": 21.921383,
                "longitude": -161.679633
              },
              {
                "ident": "CRESP",
                "latitude": 22.205556,
                "longitude": -163.914444
              },
              {
                "ident": "23N170W",
                "latitude": 23,
                "longitude": -170
              },
              {
                "ident": "25N180E",
                "latitude": 25,
                "longitude": 180
              },
              {
                "ident": "27N170E",
                "latitude": 27,
                "longitude": 170
              },
              {
                "ident": "28N160E",
                "latitude": 28,
                "longitude": 160
              },
              {
                "ident": "31N150E",
                "latitude": 31,
                "longitude": 150
              },
              {
                "ident": "TONIK",
                "latitude": 32.003806,
                "longitude": 145.996414
              }
            ],
            "unresolvedFixes": [],
            "remarks": "TRK B NOT AVAILABLE",
            "message": "(TDM TRK A 261103190001 2611031900 2611040800 PUPPI CRESP 23N170W 25N180E 27N170E 28N160E 31N150E TONIK RTS/PHNL KEOLA PUPPI TONIK G223 BEGAD RMK/TRK B NOT AVAILABLE )"
          },
          {
            "system": "pacots",
            "identifier": "C",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5314/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "KATCH HMPTN GRIZZ CJAYY 58N160W 58N170W ECOMI NATES NIKLL NYMPH NUZAN NRKEY NIPPI",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": null,
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "E",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5310/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "BOXER FULMR FASEL 52N140W 55N150W 56N160W 56N170W ALDOZ AMOND SYA AAMYY ASPIN AKISU AGEDI ADGOR",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": null,
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "F",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5311/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "ALCOA ALLBE ADTIL 35N140W 33N150W 31N160W 30N170W 30N180E 30N170E 31N160E 33N150E MORAY",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": null,
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "H",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5312/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "BAART BARAZ BILLO 30N150W 29N160W 28N170W 27N180E 26N170E 25N160E 24N150E 23N140E TUNTO",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "TRK H ONLY AVAILABLE TO ACFT LANDING RCTP OR SOUTH",
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "J",
            "direction": "west",
            "issuingAuthority": "KZAK",
            "notamNumber": "A5318/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "REDWD VESPA 43N130W 51N140W 55N150W 57N160W OGGOE NULUK NANDY NATES NIKLL NYMPH NUZAN NIPPI",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": null,
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "1",
            "direction": "east",
            "issuingAuthority": "RJJJ",
            "notamNumber": "Q2634/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "ADGOR AGEDI AKISU ASPIN LYYLE 50N180E 51N170W 51N160W 50N150W 49N140W ROUKE",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "ACFT LDG CYVR--50N150W 50N140W PRETY GOVAD CYVR\nACFT LDG OTHER DEST--ROUKE DOLFF TOU UPR TO DEST",
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "2",
            "direction": "east",
            "issuingAuthority": "RJJJ",
            "notamNumber": "Q2634/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "KALNA 41N160E 43N170E 45N180E 46N170W 46N160W 45N150W 43N140W 41N130W TRYSH",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": null,
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "3",
            "direction": "east",
            "issuingAuthority": "RJJJ",
            "notamNumber": "Q2634/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "EMRON 40N160E 42N170E 44N180E 45N170W 45N160W 44N150W 42N140W 39N130W DACEM",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "ATM CENTER TEL:81-92-608-8870",
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "11",
            "direction": "east",
            "issuingAuthority": "RJJJ",
            "notamNumber": "Q2635/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "LEPKI 38N160E 38N170E 36N180E 32N170W THOMA",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "TRK 12 NOT AVAILABLE\nATM CENTER TEL:81-92-608-8870",
            "message": "@any"
          },
          {
            "system": "pacots",
            "identifier": "14",
            "direction": "east",
            "issuingAuthority": "RJJJ",
            "notamNumber": "Q2636/26",
            "validFrom": "@date('in the past')",
            "validTo": "@date('in the future')",
            "route": "EMRON 39N160E 41N170E 43N180E 44N170W 44N160W 43N150W 41N140W 38N130W ALLBE",
            "levels": [],
            "fixes": "@any",
            "unresolvedFixes": [],
            "remarks": "TRK 15 NOT AVAILABLE\nATM CENTER TEL:81-92-608-8870",
            "message": "@any"
          }
        ]
      }
      """

  Scenario: As cabin crew I read the same tracks as anyone else
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/oceanic-track"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "fetchedAt": "@date('in the past')",
        "tracks": "@any"
      }
      """
