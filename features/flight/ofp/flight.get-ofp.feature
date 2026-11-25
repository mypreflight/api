Feature: Get OFP for flight

  Scenario: As an admin I can get OFP for flight
    Given I am signed in as "admin"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "<div><pre>[ OFP ]\nDLH81    EDDF-KJFK  05JAN26  A339 D-AIMK\nFLIGHT LH81   CRZ FL360   AIR TIME 0815   TRIP FUEL 42.8T\n\nROUTE: EDDF OBOK3W OBOKA Z29 TORNU DCT VELED DCT BREDA\n       DCT GALSO Q63 ICTAM L179 SAWPE DCT OZZIL DCT ARPAK\n       DCT FELCA DCT OFSOX DCT SLANY DCT MALOT DCT\n       54N020W 5430N03000W 5330N04000W 52N050W DCT TUDEP\n       N526A TOPPS DCT ENE PARCH4 KJFK\n\nFIX          AWY      ALT    TRK  DIST  ELAP  USED   REM\nEDDF         DCT      363    -    0     0000  -      -\nDF999        OBOK3W   2900   261  2     0003  0.7    50.2\nDF998        OBOK3W   5300   219  2     0004  0.9    49.9\nDF996        OBOK3W   7300   188  2     0004  1.1    49.8\nDF172        OBOK3W   9800   196  3     0005  1.3    49.5\nPABVI        OBOK3W   11900  238  3     0007  1.6    49.3\nSIVDO        OBOK3W   14200  274  4     0008  1.9    49.0\nKUPIP        OBOK3W   16700  306  5     0009  2.2    48.7\nMASIR        OBOK3W   F207   319  25    0012  2.7    48.2\nRAVKI        OBOK3W   F227   336  7     0013  2.9    48.0\nDITAM        OBOK3W   F261   336  13    0015  3.3    47.5\nOBOKA        OBOK3W   F286   327  13    0017  3.6    47.2\nROCUH        Z29      F312   297  16    0020  3.9    46.9\nTOC          Z29      F360   297  35    0025  4.6    46.3\nTINIK        Z29      F360   296  2     0025  4.6    46.3\nTORNU        Z29      F360   284  10    0027  4.7    46.1\nVELED        DCT      F360   305  21    0030  5.0    45.8\nBREDA        DCT      F360   298  22    0033  5.3    45.5\nGALSO        DCT      F360   280  63    0043  6.2    44.7\nAMRIV        Q63      F360   262  19    0045  6.4    44.4\nMOMIC        Q63      F360   261  6     0046  6.5    44.3\nSUMUM        Q63      F360   261  15    0049  6.7    44.1\nBLIXY        Q63      F360   261  5     0049  6.8    44.1\nARREK        Q63      F360   261  5     0050  6.9    44.0\nERING        Q63      F360   261  8     0051  7.0    43.9\nKOPUL        Q63      F360   260  18    0054  7.2    43.6\nIDITU        Q63      F360   268  6     0055  7.3    43.6\nIPKUS        Q63      F360   268  22    0058  7.6    43.3\nICTAM        Q63      F360   270  58    0107  8.4    42.5\nSAWPE        L179     F360   280  19    0110  8.6    42.2\nOZZIL        DCT      F360   276  29    0114  9.0    41.8\nARPAK        DCT      F360   287  35    0119  9.5    41.4\nFELCA        DCT      F360   275  8     0120  9.6    41.3\nOFSOX        DCT      F360   281  63    0130  10.5   40.4\nSLANY        DCT      F360   288  25    0133  10.8   40.1\nMALOT        DCT      F360   282  338   0226  15.7   35.2\n54N020W      NATE     F370   290  188   0255  18.4   32.5\n5430N03000W  NATE     F370   278  352   0346  22.9   28.0\n5330N04000W  NATE     F370   264  358   0434  27.0   23.8\n52N050W      NATE     F370   260  374   0523  31.0   19.8\nTUDEP        NATE     F370   248  131   0540  32.4   18.4\nTOPPS        N526A    F400   244  675   0711  39.4   11.4\nENE          DCT      F400   228  169   0734  41.1   9.7\nASPEN        PARCH4   F400   199  39    0739  41.5   9.4\nPVD          PARCH4   F400   199  69    0748  42.1   8.7\nTOD          PARCH4   F400   219  2     0748  42.1   8.7\nTRAIT        PARCH4   F302   219  32    0753  42.2   8.6\nPARCH        PARCH4   F258   219  14    0756  42.3   8.6\nCCC          PARCH4   16000  251  32    0801  42.4   8.5\nROBER        PARCH4   10500  216  18    0804  42.4   8.4\nCRAIL        PARCH4   6200   270  14    0807  42.5   8.4\nKJFK         PARCH4   2500   262  27    0815  42.8   8.1</pre></div>",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "EDDF RWY 07C  TORA 4000M  A339\nCONF     FLEX   V1   VR   V2   MARGIN\nCONF 1+F  52    145  148  153  420M\nCONF 2    49    141  144  149  510M\nCONF 3    46    137  140  145  590M"
      }
      """

  Scenario: As operations I can get OFP for flight
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "<div><pre>[ OFP ]\nDLH81    EDDF-KJFK  05JAN26  A339 D-AIMK\nFLIGHT LH81   CRZ FL360   AIR TIME 0815   TRIP FUEL 42.8T\n\nROUTE: EDDF OBOK3W OBOKA Z29 TORNU DCT VELED DCT BREDA\n       DCT GALSO Q63 ICTAM L179 SAWPE DCT OZZIL DCT ARPAK\n       DCT FELCA DCT OFSOX DCT SLANY DCT MALOT DCT\n       54N020W 5430N03000W 5330N04000W 52N050W DCT TUDEP\n       N526A TOPPS DCT ENE PARCH4 KJFK\n\nFIX          AWY      ALT    TRK  DIST  ELAP  USED   REM\nEDDF         DCT      363    -    0     0000  -      -\nDF999        OBOK3W   2900   261  2     0003  0.7    50.2\nDF998        OBOK3W   5300   219  2     0004  0.9    49.9\nDF996        OBOK3W   7300   188  2     0004  1.1    49.8\nDF172        OBOK3W   9800   196  3     0005  1.3    49.5\nPABVI        OBOK3W   11900  238  3     0007  1.6    49.3\nSIVDO        OBOK3W   14200  274  4     0008  1.9    49.0\nKUPIP        OBOK3W   16700  306  5     0009  2.2    48.7\nMASIR        OBOK3W   F207   319  25    0012  2.7    48.2\nRAVKI        OBOK3W   F227   336  7     0013  2.9    48.0\nDITAM        OBOK3W   F261   336  13    0015  3.3    47.5\nOBOKA        OBOK3W   F286   327  13    0017  3.6    47.2\nROCUH        Z29      F312   297  16    0020  3.9    46.9\nTOC          Z29      F360   297  35    0025  4.6    46.3\nTINIK        Z29      F360   296  2     0025  4.6    46.3\nTORNU        Z29      F360   284  10    0027  4.7    46.1\nVELED        DCT      F360   305  21    0030  5.0    45.8\nBREDA        DCT      F360   298  22    0033  5.3    45.5\nGALSO        DCT      F360   280  63    0043  6.2    44.7\nAMRIV        Q63      F360   262  19    0045  6.4    44.4\nMOMIC        Q63      F360   261  6     0046  6.5    44.3\nSUMUM        Q63      F360   261  15    0049  6.7    44.1\nBLIXY        Q63      F360   261  5     0049  6.8    44.1\nARREK        Q63      F360   261  5     0050  6.9    44.0\nERING        Q63      F360   261  8     0051  7.0    43.9\nKOPUL        Q63      F360   260  18    0054  7.2    43.6\nIDITU        Q63      F360   268  6     0055  7.3    43.6\nIPKUS        Q63      F360   268  22    0058  7.6    43.3\nICTAM        Q63      F360   270  58    0107  8.4    42.5\nSAWPE        L179     F360   280  19    0110  8.6    42.2\nOZZIL        DCT      F360   276  29    0114  9.0    41.8\nARPAK        DCT      F360   287  35    0119  9.5    41.4\nFELCA        DCT      F360   275  8     0120  9.6    41.3\nOFSOX        DCT      F360   281  63    0130  10.5   40.4\nSLANY        DCT      F360   288  25    0133  10.8   40.1\nMALOT        DCT      F360   282  338   0226  15.7   35.2\n54N020W      NATE     F370   290  188   0255  18.4   32.5\n5430N03000W  NATE     F370   278  352   0346  22.9   28.0\n5330N04000W  NATE     F370   264  358   0434  27.0   23.8\n52N050W      NATE     F370   260  374   0523  31.0   19.8\nTUDEP        NATE     F370   248  131   0540  32.4   18.4\nTOPPS        N526A    F400   244  675   0711  39.4   11.4\nENE          DCT      F400   228  169   0734  41.1   9.7\nASPEN        PARCH4   F400   199  39    0739  41.5   9.4\nPVD          PARCH4   F400   199  69    0748  42.1   8.7\nTOD          PARCH4   F400   219  2     0748  42.1   8.7\nTRAIT        PARCH4   F302   219  32    0753  42.2   8.6\nPARCH        PARCH4   F258   219  14    0756  42.3   8.6\nCCC          PARCH4   16000  251  32    0801  42.4   8.5\nROBER        PARCH4   10500  216  18    0804  42.4   8.4\nCRAIL        PARCH4   6200   270  14    0807  42.5   8.4\nKJFK         PARCH4   2500   262  27    0815  42.8   8.1</pre></div>",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "EDDF RWY 07C  TORA 4000M  A339\nCONF     FLEX   V1   VR   V2   MARGIN\nCONF 1+F  52    145  148  153  420M\nCONF 2    49    141  144  149  510M\nCONF 3    46    137  140  145  590M"
      }
      """

  Scenario: As cabin crew I can get OFP for flight
    Given I am signed in as "cabin crew"
    When I send a "GET" request to "/api/v1/flight/11087d20-ead0-4b7e-97ee-f1ef0ea29e4f/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "<div><pre>[ OFP ]\nDLH81    EDDF-KJFK  05JAN26  A339 D-AIMK\nFLIGHT LH81   CRZ FL360   AIR TIME 0815   TRIP FUEL 42.8T\n\nROUTE: EDDF OBOK3W OBOKA Z29 TORNU DCT VELED DCT BREDA\n       DCT GALSO Q63 ICTAM L179 SAWPE DCT OZZIL DCT ARPAK\n       DCT FELCA DCT OFSOX DCT SLANY DCT MALOT DCT\n       54N020W 5430N03000W 5330N04000W 52N050W DCT TUDEP\n       N526A TOPPS DCT ENE PARCH4 KJFK\n\nFIX          AWY      ALT    TRK  DIST  ELAP  USED   REM\nEDDF         DCT      363    -    0     0000  -      -\nDF999        OBOK3W   2900   261  2     0003  0.7    50.2\nDF998        OBOK3W   5300   219  2     0004  0.9    49.9\nDF996        OBOK3W   7300   188  2     0004  1.1    49.8\nDF172        OBOK3W   9800   196  3     0005  1.3    49.5\nPABVI        OBOK3W   11900  238  3     0007  1.6    49.3\nSIVDO        OBOK3W   14200  274  4     0008  1.9    49.0\nKUPIP        OBOK3W   16700  306  5     0009  2.2    48.7\nMASIR        OBOK3W   F207   319  25    0012  2.7    48.2\nRAVKI        OBOK3W   F227   336  7     0013  2.9    48.0\nDITAM        OBOK3W   F261   336  13    0015  3.3    47.5\nOBOKA        OBOK3W   F286   327  13    0017  3.6    47.2\nROCUH        Z29      F312   297  16    0020  3.9    46.9\nTOC          Z29      F360   297  35    0025  4.6    46.3\nTINIK        Z29      F360   296  2     0025  4.6    46.3\nTORNU        Z29      F360   284  10    0027  4.7    46.1\nVELED        DCT      F360   305  21    0030  5.0    45.8\nBREDA        DCT      F360   298  22    0033  5.3    45.5\nGALSO        DCT      F360   280  63    0043  6.2    44.7\nAMRIV        Q63      F360   262  19    0045  6.4    44.4\nMOMIC        Q63      F360   261  6     0046  6.5    44.3\nSUMUM        Q63      F360   261  15    0049  6.7    44.1\nBLIXY        Q63      F360   261  5     0049  6.8    44.1\nARREK        Q63      F360   261  5     0050  6.9    44.0\nERING        Q63      F360   261  8     0051  7.0    43.9\nKOPUL        Q63      F360   260  18    0054  7.2    43.6\nIDITU        Q63      F360   268  6     0055  7.3    43.6\nIPKUS        Q63      F360   268  22    0058  7.6    43.3\nICTAM        Q63      F360   270  58    0107  8.4    42.5\nSAWPE        L179     F360   280  19    0110  8.6    42.2\nOZZIL        DCT      F360   276  29    0114  9.0    41.8\nARPAK        DCT      F360   287  35    0119  9.5    41.4\nFELCA        DCT      F360   275  8     0120  9.6    41.3\nOFSOX        DCT      F360   281  63    0130  10.5   40.4\nSLANY        DCT      F360   288  25    0133  10.8   40.1\nMALOT        DCT      F360   282  338   0226  15.7   35.2\n54N020W      NATE     F370   290  188   0255  18.4   32.5\n5430N03000W  NATE     F370   278  352   0346  22.9   28.0\n5330N04000W  NATE     F370   264  358   0434  27.0   23.8\n52N050W      NATE     F370   260  374   0523  31.0   19.8\nTUDEP        NATE     F370   248  131   0540  32.4   18.4\nTOPPS        N526A    F400   244  675   0711  39.4   11.4\nENE          DCT      F400   228  169   0734  41.1   9.7\nASPEN        PARCH4   F400   199  39    0739  41.5   9.4\nPVD          PARCH4   F400   199  69    0748  42.1   8.7\nTOD          PARCH4   F400   219  2     0748  42.1   8.7\nTRAIT        PARCH4   F302   219  32    0753  42.2   8.6\nPARCH        PARCH4   F258   219  14    0756  42.3   8.6\nCCC          PARCH4   16000  251  32    0801  42.4   8.5\nROBER        PARCH4   10500  216  18    0804  42.4   8.4\nCRAIL        PARCH4   6200   270  14    0807  42.5   8.4\nKJFK         PARCH4   2500   262  27    0815  42.8   8.1</pre></div>",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "EDDF RWY 07C  TORA 4000M  A339\nCONF     FLEX   V1   VR   V2   MARGIN\nCONF 1+F  52    145  148  153  420M\nCONF 2    49    141  144  149  510M\nCONF 3    46    137  140  145  590M"
      }
      """

  Scenario: As operations I can get OFP for a short haul flight
    Given I am signed in as "operations"
    When I send a "GET" request to "/api/v1/flight/b3899775-278e-4496-add1-21385a13d93e/ofp"
    Then the response status should be 200
    And the response body should contain:
      """json
      {
        "ofpContent": "<div><pre>[ OFP ]\nAAL4908  KBOS-KPHL  01JAN26  B77W N720AN\nFLIGHT AA4908   CRZ FL330   AIR TIME 0058   TRIP FUEL 5.3T\n\nROUTE: KBOS PUT DCT HFD DCT CMK DCT SAX DCT ARD KPHL\n\nFIX          AWY      ALT    TRK  DIST  ELAP  USED   REM\nKBOS         DCT      20     -    0     0000  -      -\nPUT          DCT      F210   208  46    0012  1.4    10.2\nTOC          DCT      F330   263  30    0017  2.2    9.4\nHFD          DCT      F330   265  20    0021  2.6    8.9\nCMK          DCT      F330   245  51    0030  3.5    8.1\nSAX          DCT      F330   255  45    0039  4.5    7.2\nTOD          DCT      F330   200  23    0044  5.0    6.7\nARD          DCT      11000  198  29    0051  5.2    6.4\nKPHL         DCT      36     214  28    0058  5.3    6.3</pre></div>",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/KBOSKPHL_PDF_1767272400.pdf",
        "runwayAnalysis": "KBOS RWY 04L  TORA 2396M  B77W\nCONF     FLEX   V1   VR   V2   MARGIN\nCONF 1+F  52    145  148  153  420M\nCONF 2    49    141  144  149  510M\nCONF 3    46    137  140  145  590M"
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
        "ofpContent": "<div><pre>[ OFP ]\nDLH81    EDDF-KJFK  05JAN26  A339 D-AIMK\nFLIGHT LH81   CRZ FL360   AIR TIME 0815   TRIP FUEL 42.8T\n\nROUTE: EDDF OBOK3W OBOKA Z29 TORNU DCT VELED DCT BREDA\n       DCT GALSO Q63 ICTAM L179 SAWPE DCT OZZIL DCT ARPAK\n       DCT FELCA DCT OFSOX DCT SLANY DCT MALOT DCT\n       54N020W 5430N03000W 5330N04000W 52N050W DCT TUDEP\n       N526A TOPPS DCT ENE PARCH4 KJFK\n\nFIX          AWY      ALT    TRK  DIST  ELAP  USED   REM\nEDDF         DCT      363    -    0     0000  -      -\nDF999        OBOK3W   2900   261  2     0003  0.7    50.2\nDF998        OBOK3W   5300   219  2     0004  0.9    49.9\nDF996        OBOK3W   7300   188  2     0004  1.1    49.8\nDF172        OBOK3W   9800   196  3     0005  1.3    49.5\nPABVI        OBOK3W   11900  238  3     0007  1.6    49.3\nSIVDO        OBOK3W   14200  274  4     0008  1.9    49.0\nKUPIP        OBOK3W   16700  306  5     0009  2.2    48.7\nMASIR        OBOK3W   F207   319  25    0012  2.7    48.2\nRAVKI        OBOK3W   F227   336  7     0013  2.9    48.0\nDITAM        OBOK3W   F261   336  13    0015  3.3    47.5\nOBOKA        OBOK3W   F286   327  13    0017  3.6    47.2\nROCUH        Z29      F312   297  16    0020  3.9    46.9\nTOC          Z29      F360   297  35    0025  4.6    46.3\nTINIK        Z29      F360   296  2     0025  4.6    46.3\nTORNU        Z29      F360   284  10    0027  4.7    46.1\nVELED        DCT      F360   305  21    0030  5.0    45.8\nBREDA        DCT      F360   298  22    0033  5.3    45.5\nGALSO        DCT      F360   280  63    0043  6.2    44.7\nAMRIV        Q63      F360   262  19    0045  6.4    44.4\nMOMIC        Q63      F360   261  6     0046  6.5    44.3\nSUMUM        Q63      F360   261  15    0049  6.7    44.1\nBLIXY        Q63      F360   261  5     0049  6.8    44.1\nARREK        Q63      F360   261  5     0050  6.9    44.0\nERING        Q63      F360   261  8     0051  7.0    43.9\nKOPUL        Q63      F360   260  18    0054  7.2    43.6\nIDITU        Q63      F360   268  6     0055  7.3    43.6\nIPKUS        Q63      F360   268  22    0058  7.6    43.3\nICTAM        Q63      F360   270  58    0107  8.4    42.5\nSAWPE        L179     F360   280  19    0110  8.6    42.2\nOZZIL        DCT      F360   276  29    0114  9.0    41.8\nARPAK        DCT      F360   287  35    0119  9.5    41.4\nFELCA        DCT      F360   275  8     0120  9.6    41.3\nOFSOX        DCT      F360   281  63    0130  10.5   40.4\nSLANY        DCT      F360   288  25    0133  10.8   40.1\nMALOT        DCT      F360   282  338   0226  15.7   35.2\n54N020W      NATE     F370   290  188   0255  18.4   32.5\n5430N03000W  NATE     F370   278  352   0346  22.9   28.0\n5330N04000W  NATE     F370   264  358   0434  27.0   23.8\n52N050W      NATE     F370   260  374   0523  31.0   19.8\nTUDEP        NATE     F370   248  131   0540  32.4   18.4\nTOPPS        N526A    F400   244  675   0711  39.4   11.4\nENE          DCT      F400   228  169   0734  41.1   9.7\nASPEN        PARCH4   F400   199  39    0739  41.5   9.4\nPVD          PARCH4   F400   199  69    0748  42.1   8.7\nTOD          PARCH4   F400   219  2     0748  42.1   8.7\nTRAIT        PARCH4   F302   219  32    0753  42.2   8.6\nPARCH        PARCH4   F258   219  14    0756  42.3   8.6\nCCC          PARCH4   16000  251  32    0801  42.4   8.5\nROBER        PARCH4   10500  216  18    0804  42.4   8.4\nCRAIL        PARCH4   6200   270  14    0807  42.5   8.4\nKJFK         PARCH4   2500   262  27    0815  42.8   8.1</pre></div>",
        "ofpDocumentUrl": "https://www.simbrief.com/ofp/flightplans/EDDFKJFK_PDF_1769431274.pdf",
        "runwayAnalysis": "EDDF RWY 07C  TORA 4000M  A339\nCONF     FLEX   V1   VR   V2   MARGIN\nCONF 1+F  52    145  148  153  420M\nCONF 2    49    141  144  149  510M\nCONF 3    46    137  140  145  590M"
      }
      """
