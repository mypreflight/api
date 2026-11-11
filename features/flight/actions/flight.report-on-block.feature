Feature: Report on-block

  Scenario: As an admin I cannot report on-block
    Given I am signed in as "admin"
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 403
    And the response body should contain:
      """json
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """

  Scenario: As operations I cannot report on-block
    Given I am signed in as "operations"
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 403
    And the response body should contain:
      """json
      {
        "message": "Forbidden resource",
        "error": "Forbidden",
        "statusCode": 403
      }
      """

  Scenario: As a cabin crew I can report on-block for flight that reported taxiing
    Given I open a WebSocket connection as "cabin crew"
    When I subscribe to flight events for "04be266c-df78-4bec-9f50-281cc02ce7f2"
    Then I should receive flight event history within 2000ms
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 204
    And ADSB service was requested for callsign "AAL4913" and returned data:
      """json
      [
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:10:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:11:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:12:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:13:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:14:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:15:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:16:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:17:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:18:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:19:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:20:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:21:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:22:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:23:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:24:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:25:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 1800,
          "groundSpeed": 14,
          "track": 206,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:26:00.000Z",
          "latitude": 42.31117,
          "longitude": -71.04,
          "altitude": 1800,
          "verticalRate": 1700,
          "groundSpeed": 212,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:27:00.000Z",
          "latitude": 42.2583,
          "longitude": -71.07477,
          "altitude": 3500,
          "verticalRate": 1800,
          "groundSpeed": 211,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:28:00.000Z",
          "latitude": 42.20567,
          "longitude": -71.10955,
          "altitude": 5300,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:29:00.000Z",
          "latitude": 42.15326,
          "longitude": -71.14436,
          "altitude": 7000,
          "verticalRate": 1800,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:30:00.000Z",
          "latitude": 42.10101,
          "longitude": -71.17924,
          "altitude": 8800,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:31:00.000Z",
          "latitude": 42.04886,
          "longitude": -71.2142,
          "altitude": 10500,
          "verticalRate": 1800,
          "groundSpeed": 210,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:32:00.000Z",
          "latitude": 41.99677,
          "longitude": -71.24928,
          "altitude": 12300,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:33:00.000Z",
          "latitude": 41.94465,
          "longitude": -71.28449,
          "altitude": 14000,
          "verticalRate": 1800,
          "groundSpeed": 211,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:34:00.000Z",
          "latitude": 41.89245,
          "longitude": -71.31985,
          "altitude": 15800,
          "verticalRate": 1700,
          "groundSpeed": 211,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:35:00.000Z",
          "latitude": 41.84007,
          "longitude": -71.35537,
          "altitude": 17500,
          "verticalRate": 1800,
          "groundSpeed": 212,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:36:00.000Z",
          "latitude": 41.78747,
          "longitude": -71.39106,
          "altitude": 19300,
          "verticalRate": 1700,
          "groundSpeed": 214,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:37:00.000Z",
          "latitude": 41.73457,
          "longitude": -71.42691,
          "altitude": 21000,
          "verticalRate": 2400,
          "groundSpeed": 368,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:38:00.000Z",
          "latitude": 41.7224,
          "longitude": -71.56284,
          "altitude": 23400,
          "verticalRate": 2400,
          "groundSpeed": 369,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:39:00.000Z",
          "latitude": 41.70969,
          "longitude": -71.69892,
          "altitude": 25800,
          "verticalRate": 2400,
          "groundSpeed": 370,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:40:00.000Z",
          "latitude": 41.6964,
          "longitude": -71.83516,
          "altitude": 28200,
          "verticalRate": 2400,
          "groundSpeed": 370,
          "track": 262,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:41:00.000Z",
          "latitude": 41.68252,
          "longitude": -71.97152,
          "altitude": 30600,
          "verticalRate": 400,
          "groundSpeed": 371,
          "track": 262,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:42:00.000Z",
          "latitude": 41.66805,
          "longitude": -72.108,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 305,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:43:00.000Z",
          "latitude": 41.66117,
          "longitude": -72.22088,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 305,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:44:00.000Z",
          "latitude": 41.65379,
          "longitude": -72.33386,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 306,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:45:00.000Z",
          "latitude": 41.64596,
          "longitude": -72.44688,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 304,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:46:00.000Z",
          "latitude": 41.63788,
          "longitude": -72.55931,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 350,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:47:00.000Z",
          "latitude": 41.59549,
          "longitude": -72.67622,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 349,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:48:00.000Z",
          "latitude": 41.55311,
          "longitude": -72.79281,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 349,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:49:00.000Z",
          "latitude": 41.51082,
          "longitude": -72.90909,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 348,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:50:00.000Z",
          "latitude": 41.46867,
          "longitude": -73.02503,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 347,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:51:00.000Z",
          "latitude": 41.42673,
          "longitude": -73.14063,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 346,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:52:00.000Z",
          "latitude": 41.38502,
          "longitude": -73.25588,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 345,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:53:00.000Z",
          "latitude": 41.3436,
          "longitude": -73.37077,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 343,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:54:00.000Z",
          "latitude": 41.30249,
          "longitude": -73.4853,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 342,
          "track": 245,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:55:00.000Z",
          "latitude": 41.2617,
          "longitude": -73.59948,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 299,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:56:00.000Z",
          "latitude": 41.23876,
          "longitude": -73.70562,
          "altitude": 31000,
          "verticalRate": 2000,
          "groundSpeed": 298,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:57:00.000Z",
          "latitude": 41.21615,
          "longitude": -73.81148,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 297,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:58:00.000Z",
          "latitude": 41.19387,
          "longitude": -73.91706,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 296,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:59:00.000Z",
          "latitude": 41.17189,
          "longitude": -74.02237,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 295,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:00:00.000Z",
          "latitude": 41.15017,
          "longitude": -74.12743,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 295,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:01:00.000Z",
          "latitude": 41.12866,
          "longitude": -74.23224,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 294,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:02:00.000Z",
          "latitude": 41.10732,
          "longitude": -74.33683,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 294,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:03:00.000Z",
          "latitude": 41.08608,
          "longitude": -74.44121,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 292,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:04:00.000Z",
          "latitude": 41.06502,
          "longitude": -74.54504,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 267,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:05:00.000Z",
          "latitude": 40.99522,
          "longitude": -74.57812,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 268,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:06:00.000Z",
          "latitude": 40.92513,
          "longitude": -74.61125,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 269,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:07:00.000Z",
          "latitude": 40.85468,
          "longitude": -74.64446,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 271,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:08:00.000Z",
          "latitude": 40.78385,
          "longitude": -74.67778,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 272,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:09:00.000Z",
          "latitude": 40.71261,
          "longitude": -74.71122,
          "altitude": 33000,
          "verticalRate": -3100,
          "groundSpeed": 241,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:10:00.000Z",
          "latitude": 40.64896,
          "longitude": -74.73819,
          "altitude": 29900,
          "verticalRate": -3200,
          "groundSpeed": 242,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:11:00.000Z",
          "latitude": 40.58491,
          "longitude": -74.76533,
          "altitude": 26700,
          "verticalRate": -3100,
          "groundSpeed": 244,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:12:00.000Z",
          "latitude": 40.52048,
          "longitude": -74.79264,
          "altitude": 23600,
          "verticalRate": -3200,
          "groundSpeed": 245,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:13:00.000Z",
          "latitude": 40.45569,
          "longitude": -74.82013,
          "altitude": 20400,
          "verticalRate": -3100,
          "groundSpeed": 246,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:14:00.000Z",
          "latitude": 40.39059,
          "longitude": -74.84779,
          "altitude": 17300,
          "verticalRate": -3200,
          "groundSpeed": 247,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:15:00.000Z",
          "latitude": 40.32525,
          "longitude": -74.87561,
          "altitude": 14100,
          "verticalRate": -3100,
          "groundSpeed": 248,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:16:00.000Z",
          "latitude": 40.25972,
          "longitude": -74.90358,
          "altitude": 11000,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 213,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:17:00.000Z",
          "latitude": 40.20418,
          "longitude": -74.95168,
          "altitude": 9400,
          "verticalRate": -1500,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:18:00.000Z",
          "latitude": 40.14858,
          "longitude": -74.99987,
          "altitude": 7900,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:19:00.000Z",
          "latitude": 40.09299,
          "longitude": -75.04811,
          "altitude": 6300,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:20:00.000Z",
          "latitude": 40.03747,
          "longitude": -75.09639,
          "altitude": 4700,
          "verticalRate": -1500,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:21:00.000Z",
          "latitude": 39.98208,
          "longitude": -75.14467,
          "altitude": 3200,
          "verticalRate": -1600,
          "groundSpeed": 239,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:22:00.000Z",
          "latitude": 39.92688,
          "longitude": -75.19291,
          "altitude": 1600,
          "verticalRate": -1600,
          "groundSpeed": 239,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:23:00.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 214,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:23:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:24:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:25:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:26:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        }
      ]
      """
    When I send a "GET" request to "/api/v1/user/fcf6f4bc-290d-43a9-843c-409cd47e143d/travel"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "b92a34c1-3d77-4a6b-9d11-80c95ccc01db",
          "userId": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
          "type": "performing_flight",
          "status": "finished",
          "departureAirport": {
            "id": "c03a79fb-c5ae-46c3-95fe-f3b5dc7b85f3",
            "name": "Boston Logan Intl",
            "iataCode": "BOS"
          },
          "destinationAirport": {
            "id": "e764251b-bb25-4e8b-8cc7-11b0397b4554",
            "name": "Philadelphia Intl",
            "iataCode": "PHL"
          },
          "distance": 243,
          "flightId": "04be266c-df78-4bec-9f50-281cc02ce7f2",
          "createdAt": "2026-01-01T09:00:00.000Z",
          "updatedAt": "@date('within 1 minute from now')"
        }
      ]
      """
    When I send a "GET" request to "/api/v1/operator/1f630d38-ad24-47cc-950b-3783e71bbd10/aircraft/a10c21e3-3ac1-4265-9d12-da9baefa2d98/reposition"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "4072bdb0-5a63-4d02-abc5-40d5d18a7abc",
          "aircraftId": "a10c21e3-3ac1-4265-9d12-da9baefa2d98",
          "type": "performing_flight",
          "status": "finished",
          "departureAirport": {
            "id": "c03a79fb-c5ae-46c3-95fe-f3b5dc7b85f3",
            "name": "Boston Logan Intl",
            "iataCode": "BOS"
          },
          "destinationAirport": {
            "id": "e764251b-bb25-4e8b-8cc7-11b0397b4554",
            "name": "Philadelphia Intl",
            "iataCode": "PHL"
          },
          "distance": 243,
          "flightId": "04be266c-df78-4bec-9f50-281cc02ce7f2",
          "createdAt": "2026-01-01T09:00:00.000Z",
          "updatedAt": "@date('within 1 minute from now')"
        }
      ]
      """
    When I send a "GET" request to "/api/v1/operator/1f630d38-ad24-47cc-950b-3783e71bbd10/aircraft/a10c21e3-3ac1-4265-9d12-da9baefa2d98"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "id": "a10c21e3-3ac1-4265-9d12-da9baefa2d98",
        "airframe": {
          "type": "B77W",
          "iataType": "77W",
          "name": "Boeing 777-300ER",
          "cruiseSpeed": { "value": 0.84, "unit": "mach" },
          "serviceCeiling": 43000,
          "performanceCode": "D",
          "weightCategory": "heavy",
          "serviceType": "passenger"
        },
        "livery": "Team USA (2023)",
        "registration": "N78881",
        "selcal": "KY-JO",
        "currentState": "idle",
        "etopsThresholdMinutes": 180,
        "cabinLayout": {
          "id": "aa-77w",
          "airlineIata": "AA",
          "aircraftIata": "77W",
          "variant": null,
          "revision": 1,
          "retired": false,
          "mismatched": false
        },
        "baseAirport": {
          "id": "3c721cc6-c653-4fad-be43-dc9d6a149383",
          "iataCode": "JFK",
          "name": "New York JFK",
          "city": {
            "id": "6ef8953e-7c45-417a-b850-7e3c53de54cd",
            "name": "New York"
          },
          "country": {
            "code": "US",
            "name": "United States of America"
          },
          "location": "@coordinates"
        },
        "lastAirport": {
          "id": "e764251b-bb25-4e8b-8cc7-11b0397b4554",
          "iataCode": "PHL",
          "name": "Philadelphia Intl",
          "city": {
            "id": "e30d5e72-29ca-4f01-8e75-fdc55e3b296a",
            "name": "Philadelphia"
          },
          "country": {
            "code": "US",
            "name": "United States of America"
          },
          "location": "@coordinates"
        },
        "lastAirportUpdatedAt": "@date('within 1 minute from now')",
        "holdVariant": null,
        "lastParkingPosition": null
      }
      """
    When I send a "GET" request to "/api/v1/user/me/stats"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "total": {
          "blockTime": "@any",
          "totalFuelBurned": 334400,
          "totalFlightTime": "@any",
          "totalGreatCircleDistance": 8540
        }
      }
      """
    When I send a "GET" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "id": "04be266c-df78-4bec-9f50-281cc02ce7f2",
        "flightNumber": "AA4913",
        "callsign": "AAL4913",
        "atcCallsign": "AAL13J",
        "isEtops": false,
        "status": "on_block",
        "timesheet": {
          "scheduled": {
            "arrivalTime": "2026-01-01T14:13:00.000Z",
            "onBlockTime": "2026-01-01T14:31:00.000Z",
            "takeoffTime": "2026-01-01T13:15:00.000Z",
            "offBlockTime": "2026-01-01T13:00:00.000Z"
          },
          "estimated": {
            "arrivalTime": "2026-01-01T14:03:00.000Z",
            "onBlockTime": "2026-01-01T14:21:00.000Z",
            "takeoffTime": "2026-01-01T13:15:00.000Z",
            "offBlockTime": "2026-01-01T13:00:00.000Z"
          },
          "actual": {
            "arrivalTime": "2026-01-01T14:23:00.000Z",
            "onBlockTime": "@date('within 1 minute from now')",
            "takeoffTime": "2026-01-01T13:25:00.000Z",
            "offBlockTime": "2026-01-01T13:10:00.000Z"
          }
        },
        "aircraft": {
          "id": "a10c21e3-3ac1-4265-9d12-da9baefa2d98",
          "airframe": {
            "type": "B77W",
            "iataType": "77W",
            "name": "Boeing 777-300ER",
            "cruiseSpeed": { "value": 0.84, "unit": "mach" },
            "serviceCeiling": 43000,
            "performanceCode": "D",
            "weightCategory": "heavy",
            "serviceType": "passenger"
          },
          "registration": "N78881",
          "selcal": "KY-JO",
          "livery": "Team USA (2023)",
          "operator": {
            "id": "1f630d38-ad24-47cc-950b-3783e71bbd10",
            "icaoCode": "AAL",
            "iataCode": "AA",
            "shortName": "American Airlines",
            "fullName": "American Airlines, Inc.",
            "callsign": "AMERICAN"
          },
          "cabinLayout": {
            "id": "aa-77w",
            "airlineIata": "AA",
            "aircraftIata": "77W",
            "variant": null,
            "revision": 1,
            "retired": false,
            "mismatched": false
          }
        },
        "operator": {
          "id": "1f630d38-ad24-47cc-950b-3783e71bbd10",
          "icaoCode": "AAL",
          "iataCode": "AA",
          "shortName": "American Airlines",
          "fullName": "American Airlines, Inc.",
          "callsign": "AMERICAN"
        },
        "airports": [
          {
            "id": "c03a79fb-c5ae-46c3-95fe-f3b5dc7b85f3",
            "icaoCode": "KBOS",
            "iataCode": "BOS",
            "city": {
              "id": "19364a7d-3982-43e5-9630-9ce7c3a44e98",
              "name": "Boston"
            },
            "name": "Boston Logan Intl",
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "timezone": "America/New_York",
            "continent": "north_america",
            "dataQuality": "low",
            "location": {
              "longitude": -71.01663,
              "latitude": 42.36454
            },
            "type": "departure",
            "shape": "@coordinates"
          },
          {
            "id": "e764251b-bb25-4e8b-8cc7-11b0397b4554",
            "icaoCode": "KPHL",
            "iataCode": "PHL",
            "city": {
              "id": "e30d5e72-29ca-4f01-8e75-fdc55e3b296a",
              "name": "Philadelphia"
            },
            "name": "Philadelphia Intl",
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "timezone": "America/New_York",
            "type": "destination",
            "continent": "north_america",
            "dataQuality": "low",
            "location": {
              "longitude": -75.24349,
              "latitude": 39.87113
            },
            "shape": "@coordinates"
          },
          {
            "id": "3c721cc6-c653-4fad-be43-dc9d6a149383",
            "icaoCode": "KJFK",
            "iataCode": "JFK",
            "city": {
              "id": "6ef8953e-7c45-417a-b850-7e3c53de54cd",
              "name": "New York"
            },
            "name": "New York JFK",
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "timezone": "America/New_York",
            "continent": "north_america",
            "dataQuality": "low",
            "location": {
              "longitude": -73.7781,
              "latitude": 40.6413
            },
            "type": "destination_alternate",
            "shape": "@coordinates"
          }
        ],
        "departureParkingPositionId": null,
        "departureRunwayId": "08a1d5f0-fbfb-4272-9cc4-6821506fe308",
        "arrivalParkingPositionId": null,
        "arrivalRunwayId": null,
        "isFlightDiverted": false,
        "isEmergencyDeclared": false,
        "hasFlightPath": true,
        "hasNotoc": true,
        "isOffBlockDelayed": false,
        "actualFuelBurned": null,
        "source": "simbrief",
        "tracking": "public",
        "serviceType": "passenger",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "pilot": {
          "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
          "name": "Rick Doe",
          "pilotLicenseId": "UK-31270",
          "totalFlightTime": "@any"
        }
      }
      """
    When I send a "GET" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/path"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:10:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:11:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:12:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:13:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:14:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:15:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:16:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:17:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:18:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:19:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:20:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:21:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:22:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:23:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:24:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:25:00.000Z",
          "latitude": 42.3643,
          "longitude": -71.0052,
          "altitude": 0,
          "verticalRate": 1800,
          "groundSpeed": 14,
          "track": 206,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:26:00.000Z",
          "latitude": 42.31117,
          "longitude": -71.04,
          "altitude": 1800,
          "verticalRate": 1700,
          "groundSpeed": 212,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:27:00.000Z",
          "latitude": 42.2583,
          "longitude": -71.07477,
          "altitude": 3500,
          "verticalRate": 1800,
          "groundSpeed": 211,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:28:00.000Z",
          "latitude": 42.20567,
          "longitude": -71.10955,
          "altitude": 5300,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:29:00.000Z",
          "latitude": 42.15326,
          "longitude": -71.14436,
          "altitude": 7000,
          "verticalRate": 1800,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:30:00.000Z",
          "latitude": 42.10101,
          "longitude": -71.17924,
          "altitude": 8800,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 206,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:31:00.000Z",
          "latitude": 42.04886,
          "longitude": -71.2142,
          "altitude": 10500,
          "verticalRate": 1800,
          "groundSpeed": 210,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:32:00.000Z",
          "latitude": 41.99677,
          "longitude": -71.24928,
          "altitude": 12300,
          "verticalRate": 1700,
          "groundSpeed": 210,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:33:00.000Z",
          "latitude": 41.94465,
          "longitude": -71.28449,
          "altitude": 14000,
          "verticalRate": 1800,
          "groundSpeed": 211,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:34:00.000Z",
          "latitude": 41.89245,
          "longitude": -71.31985,
          "altitude": 15800,
          "verticalRate": 1700,
          "groundSpeed": 211,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:35:00.000Z",
          "latitude": 41.84007,
          "longitude": -71.35537,
          "altitude": 17500,
          "verticalRate": 1800,
          "groundSpeed": 212,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:36:00.000Z",
          "latitude": 41.78747,
          "longitude": -71.39106,
          "altitude": 19300,
          "verticalRate": 1700,
          "groundSpeed": 214,
          "track": 207,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:37:00.000Z",
          "latitude": 41.73457,
          "longitude": -71.42691,
          "altitude": 21000,
          "verticalRate": 2400,
          "groundSpeed": 368,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:38:00.000Z",
          "latitude": 41.7224,
          "longitude": -71.56284,
          "altitude": 23400,
          "verticalRate": 2400,
          "groundSpeed": 369,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:39:00.000Z",
          "latitude": 41.70969,
          "longitude": -71.69892,
          "altitude": 25800,
          "verticalRate": 2400,
          "groundSpeed": 370,
          "track": 263,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:40:00.000Z",
          "latitude": 41.6964,
          "longitude": -71.83516,
          "altitude": 28200,
          "verticalRate": 2400,
          "groundSpeed": 370,
          "track": 262,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:41:00.000Z",
          "latitude": 41.68252,
          "longitude": -71.97152,
          "altitude": 30600,
          "verticalRate": 400,
          "groundSpeed": 371,
          "track": 262,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:42:00.000Z",
          "latitude": 41.66805,
          "longitude": -72.108,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 305,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:43:00.000Z",
          "latitude": 41.66117,
          "longitude": -72.22088,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 305,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:44:00.000Z",
          "latitude": 41.65379,
          "longitude": -72.33386,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 306,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:45:00.000Z",
          "latitude": 41.64596,
          "longitude": -72.44688,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 304,
          "track": 265,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:46:00.000Z",
          "latitude": 41.63788,
          "longitude": -72.55931,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 350,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:47:00.000Z",
          "latitude": 41.59549,
          "longitude": -72.67622,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 349,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:48:00.000Z",
          "latitude": 41.55311,
          "longitude": -72.79281,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 349,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:49:00.000Z",
          "latitude": 41.51082,
          "longitude": -72.90909,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 348,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:50:00.000Z",
          "latitude": 41.46867,
          "longitude": -73.02503,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 347,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:51:00.000Z",
          "latitude": 41.42673,
          "longitude": -73.14063,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 346,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:52:00.000Z",
          "latitude": 41.38502,
          "longitude": -73.25588,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 345,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:53:00.000Z",
          "latitude": 41.3436,
          "longitude": -73.37077,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 343,
          "track": 244,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:54:00.000Z",
          "latitude": 41.30249,
          "longitude": -73.4853,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 342,
          "track": 245,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:55:00.000Z",
          "latitude": 41.2617,
          "longitude": -73.59948,
          "altitude": 31000,
          "verticalRate": 0,
          "groundSpeed": 299,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:56:00.000Z",
          "latitude": 41.23876,
          "longitude": -73.70562,
          "altitude": 31000,
          "verticalRate": 2000,
          "groundSpeed": 298,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:57:00.000Z",
          "latitude": 41.21615,
          "longitude": -73.81148,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 297,
          "track": 254,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:58:00.000Z",
          "latitude": 41.19387,
          "longitude": -73.91706,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 296,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T13:59:00.000Z",
          "latitude": 41.17189,
          "longitude": -74.02237,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 295,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:00:00.000Z",
          "latitude": 41.15017,
          "longitude": -74.12743,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 295,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:01:00.000Z",
          "latitude": 41.12866,
          "longitude": -74.23224,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 294,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:02:00.000Z",
          "latitude": 41.10732,
          "longitude": -74.33683,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 294,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:03:00.000Z",
          "latitude": 41.08608,
          "longitude": -74.44121,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 292,
          "track": 255,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:04:00.000Z",
          "latitude": 41.06502,
          "longitude": -74.54504,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 267,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:05:00.000Z",
          "latitude": 40.99522,
          "longitude": -74.57812,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 268,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:06:00.000Z",
          "latitude": 40.92513,
          "longitude": -74.61125,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 269,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:07:00.000Z",
          "latitude": 40.85468,
          "longitude": -74.64446,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 271,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:08:00.000Z",
          "latitude": 40.78385,
          "longitude": -74.67778,
          "altitude": 33000,
          "verticalRate": 0,
          "groundSpeed": 272,
          "track": 200,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:09:00.000Z",
          "latitude": 40.71261,
          "longitude": -74.71122,
          "altitude": 33000,
          "verticalRate": -3100,
          "groundSpeed": 241,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:10:00.000Z",
          "latitude": 40.64896,
          "longitude": -74.73819,
          "altitude": 29900,
          "verticalRate": -3200,
          "groundSpeed": 242,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:11:00.000Z",
          "latitude": 40.58491,
          "longitude": -74.76533,
          "altitude": 26700,
          "verticalRate": -3100,
          "groundSpeed": 244,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:12:00.000Z",
          "latitude": 40.52048,
          "longitude": -74.79264,
          "altitude": 23600,
          "verticalRate": -3200,
          "groundSpeed": 245,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:13:00.000Z",
          "latitude": 40.45569,
          "longitude": -74.82013,
          "altitude": 20400,
          "verticalRate": -3100,
          "groundSpeed": 246,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:14:00.000Z",
          "latitude": 40.39059,
          "longitude": -74.84779,
          "altitude": 17300,
          "verticalRate": -3200,
          "groundSpeed": 247,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:15:00.000Z",
          "latitude": 40.32525,
          "longitude": -74.87561,
          "altitude": 14100,
          "verticalRate": -3100,
          "groundSpeed": 248,
          "track": 198,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:16:00.000Z",
          "latitude": 40.25972,
          "longitude": -74.90358,
          "altitude": 11000,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 213,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:17:00.000Z",
          "latitude": 40.20418,
          "longitude": -74.95168,
          "altitude": 9400,
          "verticalRate": -1500,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:18:00.000Z",
          "latitude": 40.14858,
          "longitude": -74.99987,
          "altitude": 7900,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:19:00.000Z",
          "latitude": 40.09299,
          "longitude": -75.04811,
          "altitude": 6300,
          "verticalRate": -1600,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:20:00.000Z",
          "latitude": 40.03747,
          "longitude": -75.09639,
          "altitude": 4700,
          "verticalRate": -1500,
          "groundSpeed": 240,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:21:00.000Z",
          "latitude": 39.98208,
          "longitude": -75.14467,
          "altitude": 3200,
          "verticalRate": -1600,
          "groundSpeed": 239,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:22:00.000Z",
          "latitude": 39.92688,
          "longitude": -75.19291,
          "altitude": 1600,
          "verticalRate": -1600,
          "groundSpeed": 239,
          "track": 214,
          "isOnGround": false,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:23:00.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 214,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:23:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:24:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:25:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        },
        {
          "callsign": "AAL4913",
          "date": "2026-01-01T14:26:01.000Z",
          "latitude": 39.8719,
          "longitude": -75.2411,
          "altitude": 0,
          "verticalRate": 0,
          "groundSpeed": 14,
          "track": 0,
          "isOnGround": true,
          "squawk": "7654",
          "alert": false,
          "emergency": false,
          "spi": false
        }
      ]
      """
    When I send a "GET" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/events"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "079f2632-c0ab-4dd1-9646-522b5c370fe5",
          "scope": "operations",
          "type": "flight.created",
          "payload": {},
          "actor": {
            "id": "721ab705-8608-4386-86b4-2f391a3655a7",
            "name": "Alice Doe"
          },
          "createdAt": "2026-01-01T11:00:00.000Z"
        },
        {
          "id": "dd8871ca-4d02-4b8f-910f-829fa78b9300",
          "scope": "operations",
          "type": "flight.preliminary-loadsheet-updated",
          "payload": {},
          "actor": {
            "id": "721ab705-8608-4386-86b4-2f391a3655a7",
            "name": "Alice Doe"
          },
          "createdAt": "2026-01-01T11:05:00.000Z"
        },
        {
          "id": "95d4986f-4211-4209-8479-deb63de7239f",
          "scope": "operations",
          "type": "flight.released",
          "payload": {},
          "actor": {
            "id": "721ab705-8608-4386-86b4-2f391a3655a7",
            "name": "Alice Doe"
          },
          "createdAt": "2026-01-01T11:10:00.000Z"
        },
        {
          "id": "2d5e21dd-b89d-4f40-bf8b-86317da51147",
          "scope": "user",
          "type": "flight.pilot-checked-in",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T12:00:00.000Z"
        },
        {
          "id": "527def55-574b-4740-8876-c6af56e7c060",
          "scope": "user",
          "type": "flight.boarding-started",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T12:40:00.000Z"
        },
        {
          "id": "2a64d3fa-3615-4ced-a0ea-5d528f6e8cae",
          "scope": "user",
          "type": "flight.boarding-finished",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T13:05:00.000Z"
        },
        {
          "id": "72655033-7a10-40d7-824b-5f20784f762d",
          "scope": "user",
          "type": "flight.off-block-reported",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T13:10:00.000Z"
        },
        {
          "id": "5ce2ea2b-55b0-4a8f-bbea-9e3fc9659f00",
          "scope": "user",
          "type": "flight.live-position-received",
          "payload": {},
          "actor": null,
          "createdAt": "2026-01-01T13:11:00.000Z"
        },
        {
          "id": "e356f0df-f0a8-4c67-a7e9-8d1bdc3c5249",
          "scope": "user",
          "type": "flight.takeoff-reported",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T13:25:00.000Z"
        },
        {
          "id": "d6880a1e-4c04-49ca-ab15-7b04d7a4aac4",
          "scope": "user",
          "type": "flight.arrival-reported",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "2026-01-01T14:23:00.000Z"
        },
        {
          "id": "@uuid",
          "scope": "user",
          "type": "flight.on-block-reported",
          "payload": {},
          "actor": {
            "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
            "name": "Rick Doe"
          },
          "createdAt": "@date('within 1 minute from now')"
        }
      ]
      """
    And I see Discord "arrival" message for flight "04be266c-df78-4bec-9f50-281cc02ce7f2" containing "Flight **AA 4913** from **Boston (BOS)** to **Philadelphia (PHL)** just arrived!"
    And I see Discord "arrival" message for flight "04be266c-df78-4bec-9f50-281cc02ce7f2" containing "Actual block time:"
    And I see Discord "arrival" message for flight "04be266c-df78-4bec-9f50-281cc02ce7f2" containing "[MyPreflight](http://localhost:5173/map/04be266c-df78-4bec-9f50-281cc02ce7f2)"
    And I should receive a live flight event of type "flight.on-block-reported" within 2000ms
    Given I am signed in as "admin"
    When I send a "GET" request to "/api/v1/user/fcf6f4bc-290d-43a9-843c-409cd47e143d"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "id": "fcf6f4bc-290d-43a9-843c-409cd47e143d",
        "name": "Rick Doe",
        "email": "cabin-crew@example.com",
        "role": "CabinCrew",
        "pilotLicenseId": "UK-31270",
        "currentFlightId": "b3899775-278e-4496-add1-21385a13d93e",
        "homeAirportId": "3c721cc6-c653-4fad-be43-dc9d6a149383",
        "lastAirportId": "e764251b-bb25-4e8b-8cc7-11b0397b4554",
        "lastAirportUpdatedAt": "@date('within 1 minute from now')"
      }
      """
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/user/me/stats/countries"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "countries": [
          {
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "flag": "🇺🇸",
            "visits": 9,
            "firstVisitAt": "2026-01-01T14:31:00.000Z",
            "lastVisitAt": "@date('within 1 minute from now')"
          },
          {
            "country": {
              "code": "DE",
              "name": "Germany"
            },
            "flag": "🇩🇪",
            "visits": 1,
            "firstVisitAt": "2026-01-03T11:45:00.000Z",
            "lastVisitAt": "2026-01-03T11:45:00.000Z"
          }
        ]
      }
      """
    When I send a "GET" request to "/api/v1/user/me/stats/cities"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "cities": [
          {
            "city": {
              "id": "e30d5e72-29ca-4f01-8e75-fdc55e3b296a",
              "name": "Philadelphia"
            },
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "visits": 8,
            "firstVisitAt": "2026-01-01T14:31:00.000Z",
            "lastVisitAt": "@date('within 1 minute from now')"
          },
          {
            "city": {
              "id": "6ef8953e-7c45-417a-b850-7e3c53de54cd",
              "name": "New York"
            },
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "visits": 1,
            "firstVisitAt": "2026-01-02T02:45:00.000Z",
            "lastVisitAt": "2026-01-02T02:45:00.000Z"
          },
          {
            "city": {
              "id": "e8e8d77d-4b22-42cb-b163-13d54eec3597",
              "name": "Frankfurt"
            },
            "country": {
              "code": "DE",
              "name": "Germany"
            },
            "visits": 1,
            "firstVisitAt": "2026-01-03T11:45:00.000Z",
            "lastVisitAt": "2026-01-03T11:45:00.000Z"
          }
        ]
      }
      """
    When I send a "GET" request to "/api/v1/user/me/postcard"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "postcards": [
          {
            "id": "6b1b8e82-b9fb-4501-8716-b039c22e5c08",
            "city": {
              "id": "e30d5e72-29ca-4f01-8e75-fdc55e3b296a",
              "name": "Philadelphia"
            },
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "imageUrl": "http://functions-mock:1089/mypreflight-files/postcards/f57fbaa1-4332-4dba-9d10-931cc053111f.png",
            "width": 1152,
            "height": 1536,
            "status": "ready",
            "awardedAt": "2026-01-01T14:31:00.000Z",
            "seenAt": null
          },
          {
            "id": "ede93ece-e158-44d9-9f5b-4bd295b605ec",
            "city": {
              "id": "6ef8953e-7c45-417a-b850-7e3c53de54cd",
              "name": "New York"
            },
            "country": {
              "code": "US",
              "name": "United States of America"
            },
            "imageUrl": "http://functions-mock:1089/mypreflight-files/postcards/aa25fe19-3d1b-48c7-919d-a0eab5eba254.png",
            "width": 1152,
            "height": 1536,
            "status": "ready",
            "awardedAt": "2026-01-02T02:45:00.000Z",
            "seenAt": null
          },
          {
            "id": "057741fa-357e-462e-a5c6-0d4e6091c685",
            "city": {
              "id": "e8e8d77d-4b22-42cb-b163-13d54eec3597",
              "name": "Frankfurt"
            },
            "country": {
              "code": "DE",
              "name": "Germany"
            },
            "imageUrl": "http://functions-mock:1089/mypreflight-files/postcards/dd8cd3b6-38bd-49b7-87f4-e03d8ec05147.png",
            "width": 1152,
            "height": 1536,
            "status": "ready",
            "awardedAt": "2026-01-03T11:45:00.000Z",
            "seenAt": null
          }
        ],
        "total": 13
      }
      """
    And I clear Discord messages directory
    And I set database to initial state

  Scenario: As a cabin crew I cannot report on-block for flight twice
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 204
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 422
    And the response body should contain:
      """json
      {
        "message": "Cannot report on-block for flight that is not taxiing in.",
        "error": "Unprocessable Content",
        "statusCode": 422
      }
      """
    And I set database to initial state

  Scenario: As a cabin crew I cannot report on-block for flight that not reported off-block
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/2d1c92f6-8ed1-4921-9a70-f71b1ed2e72d/report-on-block"
    Then the response status should be 422
    And the response body should contain:
      """json
      {
        "message": "Cannot report on-block for flight that is not taxiing in.",
        "error": "Unprocessable Content",
        "statusCode": 422
      }
      """

  Scenario: As a cabin crew I cannot report on-block for flight that does not exist
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/c0ee4dec-b1fd-44aa-822c-28a7ead0191a/report-on-block"
    Then the response status should be 404
    And the response body should contain:
      """json
      {
        "message": "Flight with given id does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As a cabin crew I cannot report on-block for flight with incorrect uuid
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/invalid-uuid/report-on-block"
    Then the response status should be 400
    And the response body should contain:
      """json
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As an unauthorized user I cannot report on-block
    When I send a "POST" request to "/api/v1/flight/04be266c-df78-4bec-9f50-281cc02ce7f2/report-on-block"
    Then the response status should be 401
    And the response body should contain:
      """json
      {
        "message": "Unauthorized",
        "statusCode": 401
      }
      """

  Scenario: Reporting on-block stops monitoring while the stored reports are retained
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/eaa29705-1c4b-47a8-b93f-5789df4cd3ef/report-on-block"
    Then the response status should be 204
    When I send a "GET" request to "/api/v1/airport/616cbdd7-ccfc-4687-8cf6-1e7236435046/weather?source=all"
    Then the response status should be 200
    And the response body should contain:
      """json
      [
        {
          "id": "bf427471-4e87-4b4c-a5f9-24f5e295ab05",
          "source": "aviation_weather_gov",
          "informationType": "metar",
          "content": "METAR EPWA 081200Z 20006KT 9999 SCT040 24/13 Q1016 NOSIG",
          "lastFetched": "2026-07-08T12:00:00.000Z"
        },
        {
          "id": "9ea4d8fe-e098-466f-a3f1-e997d34031c3",
          "source": "aviation_weather_gov",
          "informationType": "taf",
          "content": "TAF EPWA 081100Z 0812/0918 20008KT 9999 SCT040 BECMG 0900/0902 24010KT",
          "lastFetched": "2026-07-08T12:00:00.000Z"
        },
        {
          "id": "17349a5b-a0f3-4740-b04a-6493576fdccd",
          "source": "say_intentions",
          "informationType": "atis",
          "content": "Warsaw Chopin airport, information Sierra. 1030 Zulu. Arriving runway 11. Departing runway 15. Wind 150 at 9. CAVOK. Temperature 29, dewpoint 12. QNH 1013. Transition level 80. Advise on initial contact you have information Sierra.",
          "lastFetched": "2026-07-08T11:30:00.000Z"
        },
        {
          "id": "029388aa-805a-4de8-89bb-a3ac4db9a88f",
          "source": "say_intentions",
          "informationType": "metar",
          "content": "EPWA 101030Z 15009KT 130V190 CAVOK 29/12 Q1013 NOSIG",
          "lastFetched": "2026-07-08T11:30:00.000Z"
        },
        {
          "id": "51f1542c-243f-4114-adf9-164e6a22b458",
          "source": "say_intentions",
          "informationType": "taf",
          "content": "TAF EPWA 100830Z 1009/1109 17007KT CAVOK BECMG 1010/1013 26012KT",
          "lastFetched": "2026-07-08T11:30:00.000Z"
        }
      ]
      """
    And I set database to initial state

  Scenario: Reporting on-block for a diverted flight stamps where it landed
    Given I am signed in as "cabin crew"
    When I send a "POST" request to "/api/v1/flight/d5e8f1a2-3b4c-4d5e-9f6a-7b8c9d0e1f2a/report-on-block"
    Then the response status should be 204
    When I send a "GET" request to "/api/v1/user/me/stats/countries/DE"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "country": {
          "code": "DE",
          "name": "Germany"
        },
        "flag": "🇩🇪",
        "stamps": [
          {
            "icaoCode": "EDDW",
            "iataCode": "BRE",
            "airportName": "Bremen",
            "airportId": "5c88ea21-f482-47ff-8b1f-3d0c9bbd6caf",
            "flightId": "d5e8f1a2-3b4c-4d5e-9f6a-7b8c9d0e1f2a",
            "visitedAt": "@date('within 1 minute from now')"
          },
          {
            "icaoCode": "EDDF",
            "iataCode": "FRA",
            "airportName": "Frankfurt Rhein/Main",
            "airportId": "f35c094a-bec5-4803-be32-bd80a14b441a",
            "flightId": "d4a25ef2-39cf-484c-af00-a548999e8699",
            "visitedAt": "2026-01-03T11:45:00.000Z"
          }
        ]
      }
      """
    When I send a "GET" request to "/api/v1/user/me/stats/countries/US"
    Then the response status should be 200
    And the response body list "stamps" should have distinct "flightId" values
    And I set database to initial state
