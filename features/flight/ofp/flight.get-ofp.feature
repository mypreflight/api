Feature: Get OFP for flight

  Scenario: As an admin I can get OFP for flight
    Given I am signed in as "admin"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "@any",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "@any"
      }
      """

  Scenario: As operations I can get OFP for flight
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "@any",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "@any"
      }
      """

  Scenario: As cabin crew I can get OFP for flight
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "@any",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "@any"
      }
      """

  Scenario: As operations I can get OFP for a short haul flight
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/flight/b3899775-278e-4496-add1-21385a13d93e/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "@any",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/KBOSKPHL_PDF_1767272400.pdf",
        "runwayAnalysis": "@any"
      }
      """

  Scenario: As a cabin crew I cannot get OFP for flight that was not created via Simbrief
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/flight/23da8bc9-a21b-4678-b2e9-1151d3bd15ab/ofp"
    Then the response status should be 404
    And the response body should contain:
      """json
      {
        "message": "Flight with given id does not exist or no OFP for flight",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As a cabin crew I cannot get OFP for flight for invalid flight id
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/flight/invalid-flight-id/ofp"
    Then the response status should be 400
    And the response body should contain:
      """json
      {
        "message": "Validation failed (uuid v 4 is expected)",
        "error": "Bad Request",
        "statusCode": 400
      }
      """

  Scenario: As a cabin crew I cannot get OFP for non-existing flight
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/flight/11b8dbbf-9e9e-4ea4-a36a-975ab117fc87/ofp"
    Then the response status should be 404
    And the response body should contain:
      """json
      {
        "message": "Flight with given id does not exist.",
        "error": "Not Found",
        "statusCode": 404
      }
      """

  Scenario: As an unauthorized user I can get OFP for private flight
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "@any",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "@any"
      }
      """
