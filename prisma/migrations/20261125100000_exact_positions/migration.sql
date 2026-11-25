DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "flight_cargo_unit"
    WHERE "positionDesignator" IS NOT NULL
      AND NOT (
        ("deck" = 'lower' AND "compartment" IS NOT NULL
          AND "positionDesignator" ~ ('^' || "compartment"::text || '[1-9][LRP]$'))
        OR ("deck" = 'main' AND "compartment" IS NOT NULL
          AND "positionDesignator" ~ ('^(' || "compartment"::text || ')?[A-Z][LRP]$'))
      )
  ) THEN
    RAISE EXCEPTION 'a stored cargo unit position has an unknown form';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "flight_cargo_shipment" AS "shipment"
    LEFT JOIN "flight_cargo_unit" AS "unit" ON "unit"."id" = "shipment"."unitId"
    WHERE "shipment"."offloadedFrom" IS NOT NULL
      AND NOT (
        ("unit"."deck" = 'lower' AND "unit"."compartment" IS NOT NULL
          AND "shipment"."offloadedFrom" ~ ('^' || "unit"."compartment"::text || '[1-9][LRP]$'))
        OR ("unit"."deck" = 'main' AND "unit"."compartment" IS NOT NULL
          AND "shipment"."offloadedFrom" ~ ('^(' || "unit"."compartment"::text || ')?[A-Z][LRP]$'))
      )
  ) THEN
    RAISE EXCEPTION 'a stored offload position has an unknown form';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "flight_cargo_shipment"
    WHERE "dangerousGoods" ? 'ercCode'
      AND "dangerousGoods"->>'ercCode' !~ '^([1-9]|1[01])[ACEFHILMNPSWXY]+$'
  ) THEN
    RAISE EXCEPTION 'a stored emergency response code has an unknown form';
  END IF;
END $$;

CREATE TYPE "HoldPositionSide" AS ENUM ('L', 'R', 'full');

ALTER TABLE "flight_cargo_unit"
ADD COLUMN "positionRow" INTEGER,
ADD COLUMN "positionSide" "HoldPositionSide";

UPDATE "flight_cargo_unit"
SET
  "positionRow" = CASE
    WHEN "deck" = 'main'
      THEN ascii(substr("positionDesignator", length("positionDesignator") - 1, 1)) - ascii('A') + 1
    ELSE substr("positionDesignator", length("positionDesignator") - 1, 1)::integer
  END,
  "positionSide" = CASE right("positionDesignator", 1)
    WHEN 'L' THEN 'L'::"HoldPositionSide"
    WHEN 'R' THEN 'R'::"HoldPositionSide"
    ELSE 'full'::"HoldPositionSide"
  END
WHERE "positionDesignator" IS NOT NULL;

ALTER TABLE "flight_cargo_shipment" ADD COLUMN "offloadedFromPosition" JSONB;

UPDATE "flight_cargo_shipment" AS "shipment"
SET "offloadedFromPosition" = jsonb_build_object(
  'deck', "unit"."deck",
  'compartment', "unit"."compartment",
  'row', CASE
    WHEN "unit"."deck" = 'main'
      THEN ascii(substr("shipment"."offloadedFrom", length("shipment"."offloadedFrom") - 1, 1)) - ascii('A') + 1
    ELSE substr("shipment"."offloadedFrom", length("shipment"."offloadedFrom") - 1, 1)::integer
  END,
  'side', CASE right("shipment"."offloadedFrom", 1)
    WHEN 'L' THEN 'L'
    WHEN 'R' THEN 'R'
    ELSE 'full'
  END
)
FROM "flight_cargo_unit" AS "unit"
WHERE "unit"."id" = "shipment"."unitId"
  AND "shipment"."offloadedFrom" IS NOT NULL;

UPDATE "flight_cargo_shipment"
SET "dangerousGoods" = ("dangerousGoods" - 'ercCode') || jsonb_build_object(
  'responseCode', jsonb_build_object(
    'drillNumber', substring("dangerousGoods"->>'ercCode' from '^[0-9]+')::integer,
    'drillLetters', to_jsonb(regexp_split_to_array(substring("dangerousGoods"->>'ercCode' from '[A-Z]+$'), ''))
  )
)
WHERE "dangerousGoods" ? 'ercCode';

DROP INDEX "flight_cargo_unit_flightId_positionDesignator_key";

ALTER TABLE "flight_cargo_unit" DROP COLUMN "positionDesignator";

ALTER TABLE "flight_cargo_shipment" DROP COLUMN "offloadedFrom";

CREATE UNIQUE INDEX "flight_cargo_unit_flightId_deck_compartment_positionRow_pos_key" ON "flight_cargo_unit"("flightId", "deck", "compartment", "positionRow", "positionSide");

ALTER TABLE "flight_cargo_unit"
ADD CONSTRAINT "flight_cargo_unit_position_check" CHECK (
  ("positionRow" IS NULL) = ("positionSide" IS NULL)
  AND (
    "positionRow" IS NULL
    OR ("deck" IS NOT NULL AND "compartment" IS NOT NULL AND "positionRow" >= 1)
  )
);
