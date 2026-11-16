Feature: Get airport weather

  Scenario: As an admin I can read the weather of a monitored airport
    Given I am signed in as "admin"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: As a cabin crew I can read the weather of a monitored airport
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: As an unauthorized user I can read the weather of a monitored airport
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: Retained reports of an airport that is not monitored are still readable
    When I send a "GET" request to "/api/v1/airport/f35c094a-bec5-4803-be32-bd80a14b441a/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "e799cf41-0344-4b29-b111-ee9f635535e2",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EDDF 081200Z 24008KT 9999 FEW035 22/12 Q1018 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "f721308b-9a04-4b20-8af9-89b25fd1986e",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EDDF 081100Z 0812/0918 24010KT 9999 FEW035 BECMG 0815/0817 27012KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: An airport that holds no reports returns an empty collection
    When I send a "GET" request to "/api/v1/airport/523b2d2f-9b60-405a-bd5a-90eed1b58e9a/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      []
      """

  Scenario: The airport does not exist
    When I send a "GET" request to "/api/v1/airport/e1d4be0e-90cd-4b0a-9a86-2b1bd8b96b83/weather"
    Then the response status should be 404
    And the response body should contain:
      """json
      {
        "message": "Airport with given id does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: The airport id is not a valid uuid
    When I send a "GET" request to "/api/v1/airport/incorrect-uuid/weather"
    Then the response status should be 400
    And the response body should contain:
      """json
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As operations my own default source is used when no filter is given
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "17349a5b-a0f3-4740-b04a-6493576fdccd",
          "source": "say_intentions",
          "informationType": "atis",
          "content": "Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80. Advise on initial contact you have information Sierra.",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "029388aa-805a-4de8-89bb-a3ac4db9a88f",
          "source": "say_intentions",
          "informationType": "metar",
          "content": "EPWA 101030Z 15009KT 130V190 CAVOK 29/12 Q1013 NOSIG",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "51f1542c-243f-4114-adf9-164e6a22b458",
          "source": "say_intentions",
          "informationType": "taf",
          "content": "EPWA 100830Z 1009/1109 17007KT CAVOK BECMG 1010/1013 26012KT",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: An explicit user_default filter behaves the same as omitting it
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=user_default"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "17349a5b-a0f3-4740-b04a-6493576fdccd",
          "source": "say_intentions",
          "informationType": "atis",
          "content": "Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80. Advise on initial contact you have information Sierra.",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "029388aa-805a-4de8-89bb-a3ac4db9a88f",
          "source": "say_intentions",
          "informationType": "metar",
          "content": "EPWA 101030Z 15009KT 130V190 CAVOK 29/12 Q1013 NOSIG",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "51f1542c-243f-4114-adf9-164e6a22b458",
          "source": "say_intentions",
          "informationType": "taf",
          "content": "EPWA 100830Z 1009/1109 17007KT CAVOK BECMG 1010/1013 26012KT",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: As an admin my own default source resolves to aviation weather gov
    Given I am signed in as "admin"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=user_default"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: As an unauthorized user the default source resolves to aviation weather gov
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=user_default"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: Every source is requested, ordered by source then information type
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=all"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "17349a5b-a0f3-4740-b04a-6493576fdccd",
          "source": "say_intentions",
          "informationType": "atis",
          "content": "Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80. Advise on initial contact you have information Sierra.",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "029388aa-805a-4de8-89bb-a3ac4db9a88f",
          "source": "say_intentions",
          "informationType": "metar",
          "content": "EPWA 101030Z 15009KT 130V190 CAVOK 29/12 Q1013 NOSIG",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "51f1542c-243f-4114-adf9-164e6a22b458",
          "source": "say_intentions",
          "informationType": "taf",
          "content": "EPWA 100830Z 1009/1109 17007KT CAVOK BECMG 1010/1013 26012KT",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: A named source overrides the reader's own default
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=aviation_weather_gov"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: A named source is requested by an unauthorized user
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=say_intentions"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "17349a5b-a0f3-4740-b04a-6493576fdccd",
          "source": "say_intentions",
          "informationType": "atis",
          "content": "Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80. Advise on initial contact you have information Sierra.",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "029388aa-805a-4de8-89bb-a3ac4db9a88f",
          "source": "say_intentions",
          "informationType": "metar",
          "content": "EPWA 101030Z 15009KT 130V190 CAVOK 29/12 Q1013 NOSIG",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        },
        {
          "id": "51f1542c-243f-4114-adf9-164e6a22b458",
          "source": "say_intentions",
          "informationType": "taf",
          "content": "EPWA 100830Z 1009/1109 17007KT CAVOK BECMG 1010/1013 26012KT",
          "lastFetched": "2026-07-08T11:30:00.000Z",
          "publishedAt": null
        }
      ]
      """

  Scenario: The filter matches no stored report
    When I send a "GET" request to "/api/v1/airport/f35c094a-bec5-4803-be32-bd80a14b441a/weather?source=say_intentions"
    Then the response status should be 200
    And the response body should contain:
      """json
      []
      """

  Scenario: The FAA publishes one ATIS for an airport with a single ATIS
    When I send a "GET" request to "/api/v1/airport/c03a79fb-c5ae-46c3-95fe-f3b5dc7b85f3/weather?source=faa_datis"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "5d0c8d8e-2b8f-4a55-9a51-0d3c7f1e6a21",
          "source": "faa_datis",
          "informationType": "atis",
          "content": "BOS ATIS INFO E 1154Z. 21009KT 10SM FEW040 24/16 A3000 (THREE ZERO ZERO ZERO). ILS RY 4R APCH IN USE. DEPG RY 9. ...ADVS YOU HAVE INFO E.",
          "lastFetched": "2026-07-08T12:05:00.000Z",
          "publishedAt": "2026-07-08T11:54:00.000Z"
        }
      ]
      """

  Scenario: atis.guru keeps the arrival and departure ATIS apart, each with the time it was received
    When I send a "GET" request to "/api/v1/airport/f35c094a-bec5-4803-be32-bd80a14b441a/weather?source=atis_guru"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "a7e3c1b2-6f4d-4e8a-b1c9-3d2f5e7a9b04",
          "source": "atis_guru",
          "informationType": "atis_arrival",
          "content": "EDDF ARR ATIS K\n1150Z\nARR-ATIS EDDF K METAR 081150\nEXPECT INDEPENDENT PARALLEL ILS APCH RWY 25R OR RWY 25L\nTRL 70\nQNH1018\nEND OF ATIS K",
          "lastFetched": "2026-07-08T12:05:00.000Z",
          "publishedAt": "2026-07-08T11:56:00.000Z"
        },
        {
          "id": "c4b9e2d1-8a7f-4c3e-9d6b-1f0e2a3c4d58",
          "source": "atis_guru",
          "informationType": "atis_departure",
          "content": "EDDF DEP ATIS M\n1150Z -DEP-ATIS EDDF M METAR 081150\n\t-RWY 25C 18\n\t-TRL 70\n\t-QNH1018",
          "lastFetched": "2026-07-08T12:05:00.000Z",
          "publishedAt": "2026-07-08T10:41:00.000Z"
        }
      ]
      """

  Scenario: VATSIM ATIS is read on its own
    When I send a "GET" request to "/api/v1/airport/f35c094a-bec5-4803-be32-bd80a14b441a/weather?source=vatsim"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "e8f1a2b3-c4d5-4e6f-8a9b-0c1d2e3f4a5b",
          "source": "vatsim",
          "informationType": "atis_arrival",
          "content": "ARR-ATIS EDDF K METAR 081150\nEXPECT INDEPENDENT PARALLEL ILS APCH RWY 25R OR RWY 25L\nTRL 70\n24008KT 9999 FEW035 T22 DP12 QNH1018",
          "lastFetched": "2026-07-08T12:05:00.000Z",
          "publishedAt": "2026-07-08T12:04:31.000Z"
        }
      ]
      """

  Scenario: The filter value is not recognised
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=bogus_source"
    Then the response status should be 400
    And the response body should contain:
      """json
      {
        "message": "Request validation failed.",
        "error": "Bad Request",
        "statusCode": 400,
        "violations": {
          "source": [
            "source must be one of the following values: user_default, all, aviation_weather_gov, say_intentions, faa_datis, atis_guru, vatsim"
          ]
        }
      }
      """
